import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getUserFromRequest,
  updateUserProfile,
  deleteUserAccount
} from "../services/authService.js";

const router = Router();

// keis: signup
router.post("/signup", async (req, res) => {
  const { email, password, fullName, username } = req.body || {};
  try {
    const { user, token } = await registerUser(email, password, fullName, username);
    res.json({ user, token });
  } catch (error) {
    res.status(400).json({ error: error.message || "Inscription impossible." });
  }
});

router.post("/login", async (req, res) => {
  const { email, username, identifier, password } = req.body || {};
  try {
    // tristan: login
    const { user, token } = await loginUser({ email, username, identifier }, password);
    res.json({ user, token });
  } catch (error) {
    res.status(400).json({ error: error.message || "Connexion impossible." });
  }
});

router.get("/me", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Non authentifié." });
  }
  // tristan: renvoie profil
  res.json({ user });
});

router.post("/logout", async (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  // keis: logout
  await logoutUser(token);
  res.json({ ok: true });
});

router.put("/me", async (req, res) => {
  const existing = await getUserFromRequest(req);
  if (!existing) {
    return res.status(401).json({ error: "Non authentifié." });
  }
  const { fullName, email, password, username } = req.body || {};
  try {
    // keis: maj profil
    const user = await updateUserProfile(existing.id, { fullName, email, password, username });
    res.json({ user });
  } catch (error) {
    res.status(400).json({ error: error.message || "Mise à jour impossible." });
  }
});

router.delete("/me", async (req, res) => {
  const existing = await getUserFromRequest(req);
  if (!existing) {
    return res.status(401).json({ error: "Non authentifié." });
  }
  // keis: delete profil
  await deleteUserAccount(existing.id);
  res.json({ ok: true });
});

router.post("/reset-password", (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: "Email requis." });
  }
  // tristan: stub reset
  res.json({
    ok: true,
    message: "Si un compte existe pour cet email, les instructions ont été envoyées."
  });
});

export default router;
