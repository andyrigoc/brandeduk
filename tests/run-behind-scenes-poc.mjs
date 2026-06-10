/**
 * Esegue il POC in headless Chromium e stampa l'hex campionato.
 * Uso: node tests/run-behind-scenes-poc.mjs [baseUrl]
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const pocPath = "/customization-tool/poc-behind-scenes-color.html";
const port = 8765;

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (filePath.endsWith(".png")) return "image/png";
  if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

function startStaticServer() {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      try {
        const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
        const safe = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, "");
        const filePath = path.join(root, safe);
        if (!filePath.startsWith(root)) {
          res.writeHead(403);
          res.end("Forbidden");
          return;
        }
        const data = await readFile(filePath);
        res.writeHead(200, { "Content-Type": contentType(filePath) });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end("Not found");
      }
    });
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

async function runWithPlaywright(baseUrl) {
  const playwright = await import("playwright");
  const browser = await playwright.chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(baseUrl + pocPath, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForFunction(
      () => {
        const el = document.getElementById("testResult");
        return el && (el.dataset.status === "ok" || el.dataset.status === "fail");
      },
      { timeout: 60000 }
    );

    const status = await page.getAttribute("#testResult", "data-status");
    const hex = await page.textContent('[data-test="sampled-hex"]');
    const detail = await page.textContent("#testDetail");
    const frontSrc = await page.getAttribute("#neutralGarmentImg", "src");

    return { status, hex: (hex || "").trim(), detail: (detail || "").trim(), frontSrc };
  } finally {
    await browser.close();
  }
}

async function ensurePlaywright() {
  try {
    await import("playwright");
    return;
  } catch {
    await new Promise((resolve, reject) => {
      const child = spawn(
        process.platform === "win32" ? "npx.cmd" : "npx",
        ["--yes", "playwright@1.49.1", "install", "chromium"],
        { stdio: "inherit", shell: true, cwd: root }
      );
      child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error("playwright install failed"))));
    });
  }
}

const baseUrl = (process.argv[2] || `http://127.0.0.1:${port}`).replace(/\/$/, "");

async function main() {
  let server = null;
  let localBase = baseUrl;

  if (baseUrl.includes(`127.0.0.1:${port}`) || baseUrl.includes(`localhost:${port}`)) {
    server = await startStaticServer();
    localBase = `http://127.0.0.1:${port}`;
  }

  await ensurePlaywright();
  const result = await runWithPlaywright(localBase);

  if (server) server.close();

  console.log("=== POC dietro le quinte ===");
  console.log("Stato:", result.status);
  console.log("Hex campionato:", result.hex);
  console.log("Front src:", result.frontSrc);
  console.log("Dettaglio:", result.detail);

  if (result.status !== "ok") {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
