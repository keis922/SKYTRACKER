import crypto from "crypto";

// keis: hash pbkdf2 fort
export function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return { salt, hash };
}

// keis: compare hash
export function comparePassword(password, salt, hash) {
  const newHash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return newHash === hash;
}

// keis: token random long
export function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}
