/**
 * CI gate for the PDF resume. Renders a fresh PDF from the built site and
 * fails if it isn't one page, or if its text differs from the committed
 * public/resume.pdf (meaning someone changed the content and forgot to run
 * `npm run resume:pdf`).
 *
 * Text is compared rather than bytes because PDF bytes include timestamps
 * and can vary slightly between machines. Whitespace is ignored too, because
 * Chromium versions position glyphs differently enough that the extracted
 * text splits words in different places ("remote" vs "rem ote"). Any change
 * to the words themselves still fails the check.
 *
 * Usage: npm run resume:check   (builds the site first)
 * The fresh PDF is left at test-results/resume.pdf for inspection.
 */
import { resolve } from "node:path";
import { assertOnePage, readPdf, renderResumePdf } from "./resume-pdf.mts";

const COMMITTED = resolve("public/resume.pdf");
const FRESH = resolve("test-results/resume.pdf");

await renderResumePdf(FRESH);
await assertOnePage(FRESH);

const [committed, fresh] = await Promise.all([
  readPdf(COMMITTED),
  readPdf(FRESH),
]);

// Compare with all whitespace removed (see the note at the top).
const squash = (text: string) => text.replace(/\s+/g, "");
const a = squash(committed.text);
const b = squash(fresh.text);

if (a !== b) {
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  const context = (text: string) => text.slice(Math.max(0, i - 20), i + 40);
  console.error(
    [
      "public/resume.pdf is out of date with the site.",
      `  committed: …${context(a)}…`,
      `  expected:  …${context(b)}…`,
      "Run `npm run resume:pdf` and commit the new PDF.",
    ].join("\n"),
  );
  process.exit(1);
}

console.log("public/resume.pdf is one page and matches the site.");
