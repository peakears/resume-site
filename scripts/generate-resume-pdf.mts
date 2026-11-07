/**
 * Generates public/resume.pdf from the site itself, using its print styles,
 * so the PDF and the website never disagree. Fails if it isn't one page.
 *
 * Usage: npm run resume:pdf   (builds the site first)
 */
import { resolve } from "node:path";
import { assertOnePage, renderResumePdf } from "./resume-pdf.mts";

const OUTPUT = resolve("public/resume.pdf");

await renderResumePdf(OUTPUT);
await assertOnePage(OUTPUT);
console.log(`Wrote ${OUTPUT} (1 page)`);
