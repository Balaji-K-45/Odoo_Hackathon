// ──────────────────────────────────────────────────────────
// src/services/productApi.js — Products API service
// ──────────────────────────────────────────────────────────

import { apiGet, apiPost, apiPut, apiDelete, USE_MOCKS } from "./api";
import { mockProducts } from "../mock/products";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function mapProduct(product) {
  return {
    ...product,
    category: product.category_name || product.category || "",
    stock: Number(product.total_stock ?? product.stock ?? 0),
    location: product.locations?.map((location) => `${location.warehouse_name} / ${location.location_name}`).join(", ") || product.location || "",
  };
}

// In-memory mock store so CRUD works during demo
let _products = [...mockProducts];
let _nextId = _products.length + 1;

export async function getProducts() {
  if (USE_MOCKS) {
    await delay(400);
    return { success: true, data: [..._products] };
  }
  const response = await apiGet("/api/products");
  return { ...response, data: response.data.map(mapProduct) };
}

export async function getProduct(id) {
  if (USE_MOCKS) {
    await delay(300);
    const product = _products.find((p) => p.id === Number(id));
    if (!product) throw new Error("Product not found");
    return { success: true, data: { ...product } };
  }
  const response = await apiGet(`/api/products/${id}`);
  return { ...response, data: mapProduct(response.data) };
}

export async function createProduct(data) {
  if (USE_MOCKS) {
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
  const product = { ...data };
  ["initial_stock", "stock", "location_id", "stock_to_add", "warehouse_id"].forEach((field) => delete product[field]);
  return apiPost("/api/products", product);
}

export async function updateProduct(id, data) {
  if (USE_MOCKS) {
    await delay(500);
    const idx = _products.findIndex((p) => p.id === Number(id));
    if (idx === -1) throw new Error("Product not found");
    _products[idx] = { ..._products[idx], ...data };
    return { success: true, data: _products[idx] };
  }
  const product = { ...data };
  ["initial_stock", "stock", "location_id", "stock_to_add", "warehouse_id"].forEach((field) => delete product[field]);
  return apiPut(`/api/products/${id}`, product);
}

export async function deleteProduct(id) {
  if (USE_MOCKS) {
    await delay(400);
    _products = _products.filter((p) => p.id !== Number(id));
    return { success: true };
  }
  return apiDelete(`/api/products/${id}`);
}
