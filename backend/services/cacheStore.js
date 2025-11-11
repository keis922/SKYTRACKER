import { promises as fs } from "fs";
import path from "path";
const cacheDir = new URL("../cache", import.meta.url).pathname;
async function ensureDir() {
  try { await fs.mkdir(cacheDir, { recursive: true }); } catch {}
}

// keis: lit cache json
export async function readCache(key) {
  await ensureDir();
  try {
    const content = await fs.readFile(path.join(cacheDir, `${key}.json`), "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

// keis: ecrit cache json
export async function writeCache(key, data) {
  await ensureDir();
  await fs.writeFile(path.join(cacheDir, `${key}.json`), JSON.stringify(data, null, 2));
}
