# StockSense API Handoff

Base URL: `http://localhost:5000`

Authenticated requests use `Authorization: Bearer <token>`. JSON endpoints return `{ "success": true, "message": "...", "data": ... }` on success and `{ "success": false, "message": "..." }` on errors. Signup creates `WAREHOUSE_STAFF` accounts only; manager accounts must be provisioned through a trusted process.

## Authentication

| Endpoint | Method | Access | Purpose |
| --- | --- | --- | --- |
| `/api/auth/signup` | POST | Public | Create a staff account |
| `/api/auth/login` | POST | Public | Authenticate and receive a JWT |
| `/api/auth/me` | GET | Any authenticated role | Get the current user profile |
| `/api/auth/profile` | GET | Any authenticated role | Existing alias for `/me` |
| `/api/auth/forgot-password` | POST | Public | Request password-reset OTP |
| `/api/auth/verify-otp` | POST | Public | Verify reset OTP |
| `/api/auth/otp-login` | POST | Public | Sign in a Warehouse Staff account using its valid one-time email code |
| `/api/auth/reset-password` | POST | Public | Set a new password |
| `/api/auth/change-password` | POST | Any authenticated role | Change password after verifying the current password |

Signup body: `{ "name": "A User", "email": "user@example.com", "password": "secret" }`. A submitted `role` is ignored. Login body: `{ "email": "user@example.com", "password": "secret" }`. Login and signup return `data.token` and `data.user`, including `id`, `name`, `email`, and `role`.

Forgot-password emails require SMTP configuration. OTPs expire 10 minutes after they are stored using the database clock, and are invalidated if email delivery fails. OTP sign-in is restricted to `WAREHOUSE_STAFF`; any wrong or reused code is rejected. For a private local demo only, set `APP_ENV=development` and `DEV_OTP_CODE=568723` to enable a fixed staff-only code when SMTP is unavailable. Never enable that fallback outside local development. Change-password body: `{ "current_password": "...", "new_password": "..." }`; new passwords require at least 8 characters.

## Inventory APIs

| Endpoint | Method | Role | Purpose |
| --- | --- | --- | --- |
| `/api/products` | GET | Both | List/search products; accepts `search`, `category_id` |
| `/api/products/<id>` | GET | Both | Get product and per-location totals |
| `/api/products` | POST | Manager | Create product |
| `/api/products/<id>` | PUT, DELETE | Manager | Update or delete product |
| `/api/categories` | GET | Both | List categories |
| `/api/categories` | POST | Manager | Create category |
| `/api/warehouses` | GET | Both | List warehouses |
| `/api/warehouses` | POST | Manager | Create warehouse |
| `/api/warehouses/<id>` | DELETE | Manager | Delete an unused warehouse; returns 409 if stock or operation history references it |
| `/api/locations` | GET | Both | List locations; accepts `warehouse_id` |
| `/api/locations` | POST | Manager | Create location |
| `/api/stock` | GET | Both | List balances; accepts `product_id`, `location_id`, `warehouse_id`, `category_id` |
| `/api/dashboard` | GET | Both | KPIs, low/out-of-stock counts, and recent stock activity |
| `/api/analysis` | GET | Manager | 12-month operation trends, stock health, top stock balances, 90-day delivery rankings, and 14-day activity |
| `/api/ledger` | GET | Both | Stock history; accepts `product_id`, `operation_type`, `location_id`, `limit` |

Product body: `{ "name": "Steel Rod", "sku": "STEEL-001", "category_id": 1, "uom": "kg", "reorder_level": 10 }`.

## Stock Operations

The current POST endpoints validate and apply stock immediately; they do not create drafts or separate validation actions.

| Endpoint | Method | Role | Request body |
| --- | --- | --- | --- |
| `/api/receipts` | POST | Both | `{ "product_id": 1, "location_id": 1, "quantity": 50, "reference": "PO-1", "notes": "..." }` |
| `/api/deliveries` | POST | Both | `{ "product_id": 1, "location_id": 1, "quantity": 20, "reference": "DO-1", "notes": "..." }` |
| `/api/transfers` | POST | Both | `{ "product_id": 1, "source_location_id": 1, "destination_location_id": 2, "quantity": 10, "reference": "TR-1", "notes": "..." }` |
| `/api/adjustments` | POST | Both | `{ "product_id": 1, "location_id": 1, "physical_count": 97, "reference": "COUNT-1", "notes": "..." }` |

Each operation collection supports GET; receipts, deliveries, and transfers also support GET `/api/<operation>/<id>`. Adjustments currently have no single-operation GET route. Deliveries and transfers reject insufficient source stock with HTTP 400. Every committed stock change writes operation data and ledger entries in one transaction; transfers write both a negative source entry and a positive destination entry. The authenticated user ID is taken from the token, not the request body.

## Permissions and Errors

Both roles can view products, read stock, view dashboard/ledger, and create or list receipts, deliveries, transfers, and adjustments. Only `INVENTORY_MANAGER` can mutate products or create categories, warehouses, and locations. Authenticated role failures return HTTP 403; missing or invalid authentication returns HTTP 401. Other expected statuses include 200, 201, 400, 404, and 409.

Example frontend call:

```js
const response = await fetch("http://localhost:5000/api/stock?warehouse_id=1", {
  headers: { Authorization: `Bearer ${token}` },
});
const result = await response.json();
```

Set `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`, a strong `SECRET_KEY`, and `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM`, and `SMTP_USE_TLS` in `backend/.env`. For Gmail, use an App Password in `SMTP_PASSWORD`, not the account's login password. See `backend/.env.example`. Initialize the schema with the project’s schema initialization path, then run `python app.py` from `backend`; the development server listens on `127.0.0.1:5000`.