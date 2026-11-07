/**
 * CI gate for the PDF resume. Renders a fresh PDF from the built site and
 * fails if it isn't one page, or if its text differs from the committed
 * public/resume.pdf (meaning someone changed the content and forgot to run
 * `npm run resume:pdf`).
 *
 * Text is compared rather than bytes because PDF bytes include timestamps
 * and can vary slightly between machines.
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

if (committed.text !== fresh.text) {
  const a = committed.text.split(" ");
  const b = fresh.text.split(" ");
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  const context = (words: string[]) => words.slice(i, i + 12).join(" ");
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
