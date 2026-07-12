// 로컬 미리보기용 최소 정적 서버(docs/ 서빙).
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "docs");
const PORT = 4321;
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8" };

createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split("?")[0]);
    if (p.endsWith("/")) p += "index.html";
    const file = resolve(ROOT, "." + p);
    if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    const body = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("404");
  }
}).listen(PORT, () => console.log(`serving docs/ on http://localhost:${PORT}`));
