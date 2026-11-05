/**
 * Generates public/resume.pdf from the site itself, using its print styles,
 * so the PDF and the website never disagree.
 *
 * Usage: npm run resume:pdf   (builds the site first)
 */
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const PORT = 4174;
const URL = `http://localhost:${PORT}/`;
const OUTPUT = resolve("public/resume.pdf");

async function waitForServer(url: string, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // Server not up yet.
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Server at ${url} did not start within ${timeoutMs}ms`);
}

const server = spawn(
  "npx",
  ["serve", "out", "-l", String(PORT), "--no-port-switching"],
  {
    stdio: "ignore",
  },
);

try {
  await waitForServer(URL);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.emulateMedia({ media: "print", colorScheme: "light" });
  await page.goto(URL, { waitUntil: "networkidle" });
  await mkdir("public", { recursive: true });
  await page.pdf({
    path: OUTPUT,
    format: "Letter",
    margin: { top: "0.5in", bottom: "0.5in", left: "0.5in", right: "0.5in" },
    printBackground: false,
  });
  await browser.close();
  console.log(`Wrote ${OUTPUT}`);
} finally {
  server.kill();
}
