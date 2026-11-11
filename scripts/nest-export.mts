/**
 * Moves the static export from out/ into dist/<basePath>/ so the files sit
 * at the same paths they're requested at.
 *
 * `basePath: "/resume"` makes Next write URLs like /resume/_next/..., but
 * the export itself still lands at the root of out/. Cloudflare looks assets
 * up by the full request path, so they need to live under dist/resume/.
 * `_headers` must stay at the root of the assets directory, so its URL
 * patterns get the prefix instead.
 *
 * Usage: runs as part of `npm run build`, after `next build`.
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { profile } from "../src/data/profile.ts";
import { basePathOf, prefixHeaders } from "../src/lib/basePath.ts";

const root = resolve(import.meta.dirname, "..");
const out = join(root, "out");
const dist = join(root, "dist");
const basePath = basePathOf(profile.siteUrl);
const target = join(dist, basePath);

if (!existsSync(out)) {
  throw new Error(
    "out/ doesn't exist. Run `next build` first (or `npm run build`).",
  );
}

await rm(dist, { recursive: true, force: true });
await mkdir(join(target, ".."), { recursive: true });
await rename(out, target);

if (basePath) {
  const headersFile = join(target, "_headers");
  const headers = await readFile(headersFile, "utf8");
  await rm(headersFile);
  await writeFile(join(dist, "_headers"), prefixHeaders(headers, basePath));
}

console.log(`Moved the export to ${target}`);
