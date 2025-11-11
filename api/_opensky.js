// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import axios from "axios";

const openSkyTokenUrl =
  "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";
const openSkyStatesUrl = "https://opensky-network.org/api/states/all";

let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt - 30000) return cachedToken;
  const clientId = process.env.OPENSKY_CLIENT_ID;
  const clientSecret = process.env.OPENSKY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", clientId);
  params.append("client_secret", clientSecret);
  const response = await axios.post(openSkyTokenUrl, params, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: 8000
  });
  const { access_token, expires_in } = response.data || {};
  if (!access_token) return null;
  cachedToken = access_token;
  tokenExpiresAt = Date.now() + (Number(expires_in) || 300) * 1000;
  return cachedToken;
}

function buildFallbackAuth() {
  if (process.env.OPENSKY_USERNAME && process.env.OPENSKY_PASSWORD) {
    const auth = Buffer.from(
      `${process.env.OPENSKY_USERNAME}:${process.env.OPENSKY_PASSWORD}`
    ).toString("base64");
    return { Authorization: `Basic ${auth}` };
  }
  return {};
}

export async function fetchOpenSkyStates() {
  const headers = {};
  const token = await getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  else Object.assign(headers, buildFallbackAuth());
  const { data } = await axios.get(openSkyStatesUrl, { headers, timeout: 8000 });
  return data;
}
