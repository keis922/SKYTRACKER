import { logoutUser } from "../_authService.js";

// keis: clear session token
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  await logoutUser(token);
  res.status(200).json({ ok: true });
}
