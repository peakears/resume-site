/**
 * Shared helpers for the PDF resume scripts: render the built site to a PDF
 * with its print styles, and read a PDF back as page count plus plain text.
 */
import { spawn } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { chromium } from "@playwright/test";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { profile } from "../src/data/profile.ts";
import { basePathOf } from "../src/lib/basePath.ts";

const PORT = 4174;
// The build in dist/ serves the resume under its base path (/resume/).
const URL = `http://localhost:${PORT}${basePathOf(profile.siteUrl)}/`;

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

/** Serves `dist/` and prints the page to `outputPath`. Run `npm run build` first. */
export async function renderResumePdf(outputPath: string) {
  const server = spawn(
    "npx",
    ["serve", "dist", "-l", String(PORT), "--no-port-switching"],
    { stdio: "ignore" },
  );

  try {
    await waitForServer(URL);
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      await page.emulateMedia({ media: "print", colorScheme: "light" });
      await page.goto(URL, { waitUntil: "networkidle" });
      await mkdir(dirname(outputPath), { recursive: true });
      await page.pdf({
        path: outputPath,
        format: "Letter",
        margin: {
          top: "0.4in",
          bottom: "0.4in",
          left: "0.5in",
          right: "0.5in",
        },
        printBackground: false,
      });
    } finally {
      await browser.close();
    }
  } finally {
    server.kill();
  }
}

/** Returns the page count and the text of a PDF, with whitespace collapsed. */
export async function readPdf(path: string) {
  const data = new Uint8Array(await readFile(path));
  const loadingTask = getDocument({ data, verbosity: 0 });
  const doc = await loadingTask.promise;
  try {
    const parts: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      for (const item of content.items) {
        if ("str" in item) parts.push(item.str);
      }
    }
    return {
      pages: doc.numPages,
      text: parts.join(" ").replace(/\s+/g, " ").trim(),
    };
  } finally {
    await loadingTask.destroy();
  }
}

/** Throws unless the PDF is exactly one page, the resume's hard limit. */
export async function assertOnePage(path: string) {
  const { pages } = await readPdf(path);
  if (pages !== 1) {
    throw new Error(
      `${path} is ${pages} pages; the resume must fit on one page. ` +
        "Shorten content or tighten the print: styles.",
    );
  }
}
