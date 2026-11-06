# resume-site

[![CI](https://github.com/peakears/resume-site/actions/workflows/ci.yml/badge.svg)](https://github.com/peakears/resume-site/actions/workflows/ci.yml)

**Live at [patrickkearney.dev](https://patrickkearney.dev)**

My personal resume and portfolio site, built with **Next.js 16 (App Router)**, **React 19**, **TypeScript** and **Tailwind CSS v4**. It's statically exported, so it can be hosted anywhere for free.

The repo is also a portfolio piece: it shows how I structure a small frontend project, test it, and work with AI tools like [Claude Code](https://claude.com/claude-code).

## Getting started

Requires Node.js 22+ (developed on Node 24).

```bash
npm install
npx playwright install chromium   # one-time, for E2E tests
npm run dev                       # http://localhost:3000
```

## Scripts

| Script                  | What it does                                              |
| ----------------------- | --------------------------------------------------------- |
| `npm run dev`           | Start the dev server with hot reload                      |
| `npm run build`         | Build the static site into `out/`                         |
| `npm run preview`       | Serve `out/` locally on port 4173                         |
| `npm test`              | Run unit tests (Vitest + React Testing Library)           |
| `npm run test:watch`    | Run unit tests in watch mode                              |
| `npm run test:coverage` | Unit tests with a coverage report                         |
| `npm run test:e2e`      | Build, serve and run Playwright tests (desktop + mobile)  |
| `npm run typecheck`     | TypeScript in strict mode                                 |
| `npm run lint`          | ESLint (Next.js core-web-vitals + TypeScript rules)       |
| `npm run format`        | Format with Prettier (with Tailwind class sorting)        |
| `npm run resume:pdf`    | Build the site and regenerate `public/resume.pdf` from it |
| `npm run check`         | Everything above, the same gate CI will run               |

## Project structure

```
src/
  app/          Next.js App Router: layout, page, global styles
  components/   Presentational components, one per section
  data/         profile.ts: all resume content, fully typed
  lib/          Small pure helpers (date formatting)
tests/
  unit/         Vitest + Testing Library component and helper tests
  e2e/          Playwright tests against the real static build
docs/decisions/ Short records of why things are the way they are
```

### Content is data

Everything on the page comes from [`src/data/profile.ts`](src/data/profile.ts). Components only render what they're given, which keeps them easy to test with fixtures. Updating the resume never touches UI code.

### PDF resume

`public/resume.pdf` is generated from the site itself by [`scripts/generate-resume-pdf.mts`](scripts/generate-resume-pdf.mts). It loads the built page in headless Chromium with print styles, which turn the page into a compact one-page resume. Run `npm run resume:pdf` after changing `profile.ts` and commit the new PDF.

## Testing strategy

- **Unit (Vitest + React Testing Library):** pure helpers and each section component, rendered with a fixture profile. Queries use roles and accessible names, the way a user or screen reader finds things.
- **Integration/E2E (Playwright):** runs against the production static build served from `out/`, on desktop Chrome and a mobile viewport. It covers page content, in-page navigation, theme persistence, OS colour-scheme detection, no horizontal scroll, no console errors, and **axe accessibility scans in light and dark mode**.

## Branching

- `main`: production. Only updated by a PR from `develop`.
- `develop`: integration branch.
- `feature/*`, `fix/*`: short-lived branches, merged into `develop` through a PR.

Both `main` and `develop` are protected: changes arrive through pull requests, and CI must pass first.

Commits follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `test:`, `docs:`, `chore:`).

## CI

[GitHub Actions](.github/workflows/ci.yml) runs on every pull request and push to `main` and `develop`, as two parallel jobs:

- **Lint, types & unit tests:** type-check, ESLint, Prettier check, and Vitest with coverage.
- **E2E tests:** builds the static site and runs Playwright on desktop and mobile. If it fails, the HTML report and traces are uploaded as an artifact.

## Deployment

Hosted on **Cloudflare Workers** (static assets) with the custom domain `patrickkearney.dev`. Cloudflare builds straight from GitHub:

| Setting           | Value                        |
| ----------------- | ---------------------------- |
| Production branch | `main`                       |
| Build command     | `npm run build`              |
| Deploy command    | `npx wrangler deploy`        |
| Node version      | from [`.nvmrc`](.nvmrc) (24) |

[`wrangler.jsonc`](wrangler.jsonc) tells Wrangler to upload `out/` as plain static files. Without it, Wrangler assumes a Next.js app needs a server and tries to convert it with OpenNext, which fails for a static export.

To check a deploy locally: `npm run build && npx wrangler deploy --dry-run`, or `npx wrangler dev` to serve `out/` with the Cloudflare runtime.

- Merging into `main` deploys to production.
- Only `main` builds on Cloudflare; non-production branch builds are turned off. Pull requests are checked by GitHub Actions CI instead, which builds the same static export and tests it with Playwright.
- [`public/_headers`](public/_headers) sets security headers and the content type of the extensionless link-preview image.
- SEO files are generated at build time: `robots.txt`, `sitemap.xml`, and the Open Graph image from [`src/app/opengraph-image.tsx`](src/app/opengraph-image.tsx).
- The page embeds [JSON-LD](https://json-ld.org/) structured data (a schema.org `ProfilePage` about a `Person`), built from `profile.ts` by [`src/lib/jsonLd.ts`](src/lib/jsonLd.ts). Check it with the [Schema Markup Validator](https://validator.schema.org/).
- Traffic is measured with Cloudflare Web Analytics, which is cookieless, so there's no consent banner.

## Roadmap

- [x] Fill in real resume content
- [x] GitHub Actions CI on every PR
- [x] Branch protection on `main` and `develop`
- [x] Custom domain: patrickkearney.dev
- [ ] Deploy on Cloudflare with analytics
- [ ] Golf-themed background animation
