/**
 * Builds the hub page for patrickkearney.dev into hub/dist/, from the same
 * profile data as the resume site.
 *
 * Usage: npm run hub:build
 * Deploy: npx wrangler deploy --config hub/wrangler.jsonc
 */
import { copyFile, cp, mkdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { profile } from "../src/data/profile.ts";
import { renderHubPage, renderNotFoundPage } from "../src/lib/hub.ts";

const root = resolve(import.meta.dirname, "..");
const out = join(root, "hub", "dist");

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

// Stylesheet, favicon, headers and robots.txt.
await cp(join(root, "hub", "static"), out, { recursive: true });

if (profile.headshot) {
  await copyFile(
    join(root, "public", profile.headshot.src),
    join(out, "headshot.jpg"),
  );
}

await writeFile(join(out, "index.html"), renderHubPage(profile));
await writeFile(join(out, "404.html"), renderNotFoundPage(profile));

console.log(`Wrote hub to ${out}`);
