// src/api/authApi.js
// ─────────────────────────────────────────────────────────────────────
// All backend calls. Token is always fetched fresh (never cached)
// to avoid 401s from expired tokens.
// ─────────────────────────────────────────────────────────────────────

import { auth } from "../firebase/config";

const BASE_URL = `${import.meta.env.VITE_API_URL}/api/...`;

async function getAuthHeaders() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const token = await user.getIdToken(false);
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function request(path, options = {}) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

/** GET /api/user/me — returns user profile + holdings array */
export async function getMyProfile() {
  return request("/user/me");
}

/** GET /api/test — basic auth check */
export async function testSecureEndpoint() {
  return request("/test");
}

/**
 * POST /api/trade/buy
 * @param {string} asset    e.g. "BTC"
 * @param {number} amount   USD amount
 */
export async function buyAsset(asset, amount) {
  return request("/trade/buy", {
    method: "POST",
    body: JSON.stringify({ asset, amount }),
  });
}

/** GET /api/trade/history — returns list of past trades */
export async function getTradeHistory() {
  return request("/trade/history");
}