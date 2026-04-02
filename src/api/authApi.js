import { auth } from "../firebase/config";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

async function getAuthHeaders() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  // FIX: force=true forces a token refresh if expired/stale.
  // Using false (the old value) could send expired tokens causing silent 401s.
  const token = await user.getIdToken(true);
  return {
    "Content-Type": "application/json",
    Authorization: "Bearer " + token,
  };
}

async function request(path, options) {
  const headers = await getAuthHeaders();
  const res = await fetch(BASE_URL + path, Object.assign({}, options, { headers }));
  // FIX: read as text first so non-JSON error bodies (e.g. CORS HTML errors) don't crash
  const text = await res.text();
  var data = {};
  try { data = JSON.parse(text); } catch (e) { data = { error: text }; }
  if (!res.ok) throw new Error(data.message || data.error || "HTTP " + res.status);
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
    body: JSON.stringify({ asset: asset, amount: amount }),
  });
}

export async function getTradeHistory() {
  return request("/trade/history");
}
