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
import {
  renderHubPage,
  renderNotFoundPage,
  renderRobotsTxt,
  renderSitemap,
} from "../src/lib/hub.ts";

const root = resolve(import.meta.dirname, "..");
const out = join(root, "hub", "dist");

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

// Stylesheet and headers.
await cp(join(root, "hub", "static"), out, { recursive: true });
// Same icon as the resume site, from one source file.
await copyFile(join(root, "src", "app", "icon.svg"), join(out, "favicon.svg"));
// Browsers ask for /favicon.ico at the domain root, which is the hub's.
await copyFile(
  join(root, "src", "app", "favicon.ico"),
  join(out, "favicon.ico"),
);

if (profile.headshot) {
  await copyFile(
    join(root, "public", profile.headshot.src),
    join(out, "headshot.jpg"),
  );
}

await writeFile(join(out, "index.html"), renderHubPage(profile));
await writeFile(join(out, "404.html"), renderNotFoundPage(profile));
// Crawlers only read these at the domain root, so the hub serves them for
// every section (the resume at /resume, and any added later).
await writeFile(join(out, "robots.txt"), renderRobotsTxt(profile));
await writeFile(join(out, "sitemap.xml"), renderSitemap(profile));

console.log(`Wrote hub to ${out}`);
