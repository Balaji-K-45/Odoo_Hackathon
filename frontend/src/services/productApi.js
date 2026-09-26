// ──────────────────────────────────────────────────────────
// src/services/productApi.js — Products API service
// ──────────────────────────────────────────────────────────

import { apiGet, apiPost, apiPut, apiDelete } from "./api";
import { mockProducts } from "../mock/products";

const USE_MOCK = true;
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// In-memory mock store so CRUD works during demo
let _products = [...mockProducts];
let _nextId = _products.length + 1;

export async function getProducts() {
  if (USE_MOCK) {
    await delay(400);
    return { success: true, data: [..._products] };
  }
  return apiGet("/api/products");
}

export async function getProduct(id) {
  if (USE_MOCK) {
    await delay(300);
    const product = _products.find((p) => p.id === Number(id));
    if (!product) throw new Error("Product not found");
    return { success: true, data: { ...product } };
  }
  return apiGet(`/api/products/${id}`);
}

export async function createProduct(data) {
  if (USE_MOCK) {
    await delay(500);
    const newProduct = {
      id: _nextId++,
      ...data,
      stock: data.initial_stock || 0,
      created_at: new Date().toISOString().slice(0, 10),
    };
    _products.push(newProduct);
    return { success: true, data: newProduct };
  }
  return apiPost("/api/products", data);
}

export async function updateProduct(id, data) {
  if (USE_MOCK) {
    await delay(500);
    const idx = _products.findIndex((p) => p.id === Number(id));
    if (idx === -1) throw new Error("Product not found");
    _products[idx] = { ..._products[idx], ...data };
    return { success: true, data: _products[idx] };
  }
  return apiPut(`/api/products/${id}`, data);
}

export async function deleteProduct(id) {
  if (USE_MOCK) {
    await delay(400);
    _products = _products.filter((p) => p.id !== Number(id));
    return { success: true };
  }
  return apiDelete(`/api/products/${id}`);
}
