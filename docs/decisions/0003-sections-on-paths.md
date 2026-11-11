# 0003: Site sections live on paths, not subdomains

**Status:** Accepted, November 2026

## Context

The resume was at `home.patrickkearney.dev` and the hub at `patrickkearney.dev`. A photos section is planned, and we needed to pick one pattern for sections: subdomains (`photos.patrickkearney.dev`) or paths (`patrickkearney.dev/photos`).

The usual convention is paths for sections of one site, and subdomains for things that run as separate systems, such as `app.`, `api.`, `status.`, `cdn.`, or a section hosted on a different platform. The resume, hub and photos have one owner, one audience and one look, so they're sections of one site.

## Decision

- **Every section lives on a path** of the apex domain: `/resume`, later `/photos`.
- **Each section is still its own Cloudflare Worker** and claims its path with routes (`/resume` and `/resume/*`). The hub Worker has the fallback route `/*`, and the more specific route wins. Sections keep separate builds and deploys, and a section can move to another repo or stack without touching the others.
- **The hub owns the domain-wide files** that must sit at the root: `robots.txt`, `sitemap.xml` and `favicon.ico`.
- **`profile.siteUrl` is the single source of the resume's URL.** `basePath` in `next.config.ts`, the asset prefixes and the build layout are all derived from it.
- **Old URLs keep working.** `home.patrickkearney.dev/*` returns a permanent redirect (301) to `patrickkearney.dev/resume/*`.
- **Subdomains stay available for assets.** If the photos section needs to serve many large images, they can come from an R2 bucket on something like `img.patrickkearney.dev`. The gallery pages stay at `/photos`.

## Consequences

- **SEO:** one domain collects all links and search signals, instead of splitting them across subdomains.
- **Shared browser storage:** all sections share one origin, so saved settings such as the light or dark theme carry across sections. It also means sections aren't isolated from each other's scripts, which is fine because all of them are first-party.
- **More build plumbing:** static export still writes files to the root of `out/`, so `npm run build` moves them to `dist/resume/` (`scripts/nest-export.mts`). Root-relative URLs that Next doesn't handle on its own need `withBasePath`, and an E2E test catches any that were missed.
- **One-time cutover:** moving the hub from a Custom Domain to a route and adding the redirect involves dashboard steps, listed in [the cutover checklist](../runbooks/resume-path-cutover.md).
