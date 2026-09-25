// ──────────────────────────────────────────────────────────
// src/services/api.js — Reusable helpers for calling the backend API
// ──────────────────────────────────────────────────────────

// Read the backend URL ONCE from the environment variable.
// This comes from frontend/.env → VITE_API_URL=http://localhost:5000
// We never hard-code "http://localhost:5000" inside components!
const API_BASE = import.meta.env.VITE_API_URL;

/**
 * Make a GET request to the backend and return the parsed JSON.
 *
 * @param {string} path — the endpoint, e.g. "/api/health"
 * @returns {Promise<object>} — the JSON response from the backend
 * @throws {Error} — if the network fails or the backend returns an error status
 *
 * Usage:
 *   import { apiGet } from "../services/api";
 *   const data = await apiGet("/api/health");
 */
export async function apiGet(path) {
  // fetch() sends an HTTP GET request.
  //   API_BASE = "http://localhost:5000"
  //   path     = "/api/health"
  //   full URL = "http://localhost:5000/api/health"
  const response = await fetch(`${API_BASE}${path}`);

  // response.ok is true when the status code is 200-299 (success).
  // If the backend returned an error (404, 500, etc.), we throw.
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  // Parse the response body from JSON text into a JavaScript object.
  // e.g. '{"status":"success","message":"Backend is running"}' → { status: "success", message: "Backend is running" }
  return response.json();
}

/**
 * Make a POST request to the backend with a JSON body.
 * Ready for hackathon day when you need to send data (forms, etc.).
 *
 * @param {string} path — the endpoint, e.g. "/api/orders"
 * @param {object} body — the data to send, e.g. { name: "Test", quantity: 5 }
 * @returns {Promise<object>} — the JSON response from the backend
 */
export async function apiPost(path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }, // Tell backend we're sending JSON
    body: JSON.stringify(body), // Convert JS object → JSON text
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// ──────────────────────────────────────────────────────────
// Specific API functions — add more here on hackathon day!
// ──────────────────────────────────────────────────────────

/**
 * Check if the backend is alive.
 * Calls: GET /api/health
 * Returns: { status: "success", message: "Backend is running" }
 */
export async function getHealth() {
  return apiGet("/api/health");
}
