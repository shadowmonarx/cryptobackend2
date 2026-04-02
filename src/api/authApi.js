import { auth } from "../firebase/config";

// Set VITE_API_URL in Vercel: https://cryptotrade-backend-production-6c82.up.railway.app/api
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

async function getAuthHeaders() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  // FIX: force=true forces a token refresh if expired/stale.
  // The old `false` could send expired tokens → 401 → balance never loads silently.
  const token = await user.getIdToken(true);
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function request(path, options = {}) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  // FIX: capture raw text first so we can debug non-JSON errors (e.g. CORS failures return HTML)
  const text = await res.text();
  let data = {};
  try { data = JSON.parse(text); } catch { data = { error: text }; }
  if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status}`);
  return data;
}

export async function getMyProfile() {
  return request("/user/me");
}

export async function testSecureEndpoint() {
  return request("/test");
}

export async function buyAsset(asset, amount) {
  return request("/trade/buy", {
    method: "POST",
    body: JSON.stringify({ asset, amount }),
  });
}

export async function getTradeHistory() {
  return request("/trade/history");
}}

export async function getTradeHistory() {
  return request("/trade/history");
}
