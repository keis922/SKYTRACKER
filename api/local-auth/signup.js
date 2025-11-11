import { registerUser } from "../_authService.js";
import { parseJson } from "../_parseJson.js";

// keis: signup local simple
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const body = await parseJson(req);
  try {
    const { user, token } = await registerUser({
      email: body.email,
      password: body.password,
      fullName: body.fullName,
      username: body.username
    });
    res.status(200).json({ user, token });
  } catch (error) {
    res.status(400).json({ error: error.message || "Inscription impossible." });
  }
}
