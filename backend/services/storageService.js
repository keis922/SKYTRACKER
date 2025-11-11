// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import { promises as fs } from "fs";
import path from "path";

const dataDir = new URL("../data", import.meta.url).pathname;

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {}
}

export async function readJSON(filePath, defaultValue) {
  const absoluteDir = path.dirname(filePath);
  await ensureDir(absoluteDir);
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeJSON(filePath, defaultValue);
      return defaultValue;
    }
    throw error;
  }
}

export async function writeJSON(filePath, data) {
  const absoluteDir = path.dirname(filePath);
  await ensureDir(absoluteDir);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export function resolveDataPath(filename) {
  return path.join(dataDir, filename);
}
