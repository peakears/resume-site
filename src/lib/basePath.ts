/**
 * The resume is served under a path on the apex domain
 * (patrickkearney.dev/resume), so every root-relative URL needs that prefix.
 * The prefix comes from `profile.siteUrl`, so changing the URL in one place
 * moves the whole site.
 *
 * Plain functions with no imports, so next.config.ts and Node scripts can use
 * them too.
 */

/** "https://example.dev/resume" -> "/resume"; "https://example.dev" -> "". */
export function basePathOf(siteUrl: string): string {
  return new URL(siteUrl).pathname.replace(/\/+$/, "");
}

/**
 * Prefixes a root-relative path (a file in `public/`) with the base path.
 * `next/link` does this on its own, but plain `<a>`, `<img>` and
 * `next/image` with `unoptimized` don't.
 */
export function withBasePath(siteUrl: string, path: string): string {
  if (!path.startsWith("/")) {
    throw new Error(`Expected a root-relative path, got "${path}"`);
  }
  return basePathOf(siteUrl) + path;
}

/**
 * Prefixes the URL patterns in a Cloudflare `_headers` file (lines starting
 * with "/") with the base path. Header lines are indented, and comments
 * start with "#", so neither is touched.
 */
export function prefixHeaders(headers: string, basePath: string): string {
  return headers.replace(/^\/.*$/gm, (pattern) => basePath + pattern);
}
