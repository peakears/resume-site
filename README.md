# resume-site

[![CI](https://github.com/peakears/resume-site/actions/workflows/ci.yml/badge.svg)](https://github.com/peakears/resume-site/actions/workflows/ci.yml)

**Live at [patrickkearney.dev/resume](https://patrickkearney.dev/resume/)**

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
| `npm run build`         | Build the static site into `dist/resume/`                 |
| `npm run preview`       | Serve `dist/` on port 4173 (open `/resume/`)              |
| `npm test`              | Run unit tests (Vitest + React Testing Library)           |
| `npm run test:watch`    | Run unit tests in watch mode                              |
| `npm run test:coverage` | Unit tests with a coverage report                         |
| `npm run test:e2e`      | Build, serve and run Playwright tests (desktop + mobile)  |
| `npm run typecheck`     | TypeScript in strict mode                                 |
| `npm run lint`          | ESLint (Next.js core-web-vitals + TypeScript rules)       |
| `npm run format`        | Format with Prettier (with Tailwind class sorting)        |
| `npm run resume:pdf`    | Build the site and regenerate `public/resume.pdf` from it |
| `npm run resume:check`  | Fail if the PDF isn't one page or is out of date          |
| `npm run commitlint`    | Check this branch's commit messages against `develop`     |
| `npm run check`         | Everything above, the same gate CI will run               |

## Project structure

```
src/
  app/          Next.js App Router: layout, page, global styles
  components/   Presentational components, one per section
  data/         profile.ts: all resume content, fully typed
  lib/          Small pure helpers (dates, base path, hub page)
tests/
  unit/         Vitest + Testing Library component and helper tests
  e2e/          Playwright tests against the real static build
docs/decisions/ Short records of why things are the way they are
```

### Content is data

Everything on the page comes from [`src/data/profile.ts`](src/data/profile.ts). Components only render what they're given, which keeps them easy to test with fixtures. Updating the resume never touches UI code.

### Interactive terminal and mini golf

The terminal in the hero takes commands (`help`, `about`, `experience`, `skills`, `contact`, `resume`, `clear`), all printed from `profile.ts`. `golf` opens a three-hole putting game drawn on a canvas, playable with a mouse, touch or keyboard. The physics and the commands are pure modules ([`src/lib/golf.ts`](src/lib/golf.ts), [`src/lib/terminal.ts`](src/lib/terminal.ts)) with their own unit tests, and the game's code only downloads when someone types `golf`.

### PDF resume

`public/resume.pdf` is generated from the site itself by [`scripts/generate-resume-pdf.mts`](scripts/generate-resume-pdf.mts). It loads the built page in headless Chromium with print styles, which turn the page into a compact one-page resume. Run `npm run resume:pdf` after changing `profile.ts` and commit the new PDF. It fails if the PDF runs past one page.

The PDF is committed because Cloudflare's build has no browser to render it. CI guards it instead: the **Resume PDF** job runs `npm run resume:check`, which renders a fresh PDF and fails if it isn't one page or if its text differs from the committed `public/resume.pdf`. Text is compared instead of bytes, because PDF bytes include timestamps. The fresh PDF is uploaded as the `resume-pdf` workflow artifact so you can review it.

## Testing strategy

- **Unit (Vitest + React Testing Library):** pure helpers and each section component, rendered with a fixture profile. Queries use roles and accessible names, the way a user or screen reader finds things.
- **Integration/E2E (Playwright):** runs against the production static build served from `dist/` under its `/resume/` base path, on desktop Chrome and a mobile viewport. It covers page content, in-page navigation, theme persistence, OS colour-scheme detection, no horizontal scroll, no console errors, and **axe accessibility scans in light and dark mode**.

## Branching

- `main`: production. Only updated by a PR from `develop`.
- `develop`: integration branch.
- `feature/*`, `fix/*`: short-lived branches, merged into `develop` through a PR.

Both `main` and `develop` are protected: changes arrive through pull requests, and CI must pass first.

Commits follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `test:`, `docs:`, `chore:`). They decide the next version number (see [Releases](#releases)), so CI lints every commit in a pull request with [commitlint](https://commitlint.js.org/).

## CI

[GitHub Actions](.github/workflows/ci.yml) runs on every pull request and push to `main` and `develop`, as parallel jobs:

- **Commit messages** (pull requests only): commitlint checks each commit is a valid Conventional Commit.

- **Lint, types & unit tests:** type-check, ESLint, Prettier check, and Vitest with coverage.
- **E2E tests:** builds the static site and runs Playwright on desktop and mobile. If it fails, the HTML report and traces are uploaded as an artifact.

## Releases

Versions follow [semver](https://semver.org/) and are cut automatically by [semantic-release](https://semantic-release.gitbook.io/) ([`.github/workflows/release.yml`](.github/workflows/release.yml), configured in [`.releaserc.json`](.releaserc.json)). When a PR from `develop` merges into `main`, it reads the commits since the last tag and picks the bump:

| Commits since the last release                                   | Bump                  |
| ---------------------------------------------------------------- | --------------------- |
| a `BREAKING CHANGE:` footer or `!` after the type (`feat!: ...`) | major (1.4.2 → 2.0.0) |
| at least one `feat:`                                             | minor (1.4.2 → 1.5.0) |
| at least one `fix:` or `perf:`                                   | patch (1.4.2 → 1.4.3) |
| only `docs:`, `test:`, `ci:`, `chore:`, `refactor:`, ...         | no release            |

It then pushes a `vX.Y.Z` tag and publishes a [GitHub Release](https://github.com/peakears/resume-site/releases) whose notes list the features and fixes, with links to each commit, and attaches that version's resume PDF. Released PRs get no comment or label, so a release doesn't send an email per PR.

Nothing is committed back to `main`: the tags and releases are the changelog, and `version` in `package.json` stays a placeholder. To see the current version, look at the latest tag (`git describe --tags --abbrev=0`) or release.

## Deployment

Hosted on **Cloudflare Workers** (static assets) at **`patrickkearney.dev/resume`**. The resume is one section of the domain: each section is its own Worker that claims its path with a route, and the hub Worker takes everything else. See [ADR 0003](docs/decisions/0003-sections-on-paths.md) for why paths rather than subdomains, and the [cutover checklist](docs/runbooks/resume-path-cutover.md) for the move from `home.patrickkearney.dev`.

```
patrickkearney.dev
├── /resume, /resume/*  →  resume-site Worker (this repo, dist/)
├── /photos, /photos/*  →  photos Worker (later)
└── /*                  →  hub Worker (this repo, hub/dist/)

```

Cloudflare builds straight from GitHub:

| Setting           | Value                        |
| ----------------- | ---------------------------- |
| Production branch | `main`                       |
| Build command     | `npm run build`              |
| Deploy command    | `npx wrangler deploy`        |
| Node version      | from [`.nvmrc`](.nvmrc) (24) |

[`wrangler.jsonc`](wrangler.jsonc) tells Wrangler to upload `dist/` as plain static files, and declares the resume's routes. Without it, Wrangler assumes a Next.js app needs a server and tries to convert it with OpenNext, which fails for a static export.

### The `/resume` base path

[`profile.siteUrl`](src/data/profile.ts) (`https://patrickkearney.dev/resume`) is the one place the URL is set. Everything else follows from it:

- [`next.config.ts`](next.config.ts) sets `basePath` from it, so Next prefixes its own scripts, styles, fonts and icons with `/resume`.
- Plain `<a>` links and unoptimized images don't get the prefix on their own, so [`src/app/page.tsx`](src/app/page.tsx) adds it to the files from `public/` (the PDF and headshot) with [`withBasePath`](src/lib/basePath.ts).
- Static export still writes the files to the root of `out/`, but Cloudflare looks them up by the full request path. `npm run build` therefore runs [`scripts/nest-export.mts`](scripts/nest-export.mts) after `next build`, which moves the export to `dist/resume/` and adds the prefix to the patterns in `_headers`.
- An E2E test fails if the page requests or links to any same-origin URL outside `/resume/`.

To check a deploy locally: `npm run build && npx wrangler deploy --dry-run`, or `npx wrangler dev` to serve `dist/` with the Cloudflare runtime (open `/resume/`).

- Merging into `main` deploys to production.
- Only `main` builds on Cloudflare; non-production branch builds are turned off. Pull requests are checked by GitHub Actions CI instead, which builds the same static export and tests it with Playwright.
- [`public/_headers`](public/_headers) sets security headers and the content type of the extensionless link-preview image.
- The Open Graph image is generated at build time from [`src/app/opengraph-image.tsx`](src/app/opengraph-image.tsx). `robots.txt` and `sitemap.xml` are served by the hub, because crawlers only read them at the domain root.
- The page embeds [JSON-LD](https://json-ld.org/) structured data (a schema.org `ProfilePage` about a `Person`), built from `profile.ts` by [`src/lib/jsonLd.ts`](src/lib/jsonLd.ts). Check it with the [Schema Markup Validator](https://validator.schema.org/).
- Traffic is measured with Cloudflare Web Analytics, which is cookieless, so there's no consent banner.

## Hub page (patrickkearney.dev)

The apex domain serves a small hub page that links to the resume, GitHub, LinkedIn and email. It's also the fallback for every path no section claims, so it serves the domain-wide `robots.txt`, `sitemap.xml` and `favicon.ico`. It's plain HTML and CSS with no framework, generated from the same `profile.ts` by [`src/lib/hub.ts`](src/lib/hub.ts), so the two sites never disagree.

```bash
npm run hub:build     # writes hub/dist/
npm run hub:preview   # serves it on http://localhost:4175
```

It's deployed as a **second Cloudflare Worker** ([`hub/wrangler.jsonc`](hub/wrangler.jsonc)) from this repository:

| Setting           | Value                                             |
| ----------------- | ------------------------------------------------- |
| Root directory    | `/` (repository root)                             |
| Build command     | `npm run hub:build`                               |
| Deploy command    | `npx wrangler deploy --config hub/wrangler.jsonc` |
| Production branch | `main`                                            |
| Route             | `patrickkearney.dev/*` (in `hub/wrangler.jsonc`)  |

Playwright tests it alongside the resume site (`hub-desktop` and `hub-mobile` projects), including axe scans in light and dark mode.

## Roadmap

- [x] Fill in real resume content
- [x] GitHub Actions CI on every PR
- [x] Branch protection on `main` and `develop`
- [x] Custom domain: home.patrickkearney.dev
- [x] Hub page at patrickkearney.dev linking to the resume and profiles
- [ ] Move the resume to patrickkearney.dev/resume ([cutover checklist](docs/runbooks/resume-path-cutover.md))
- [ ] Photos section at patrickkearney.dev/photos
- [x] Deploy on Cloudflare with analytics
- [x] JSON-LD structured data for search engines
- [x] Semver releases with generated changelogs
- [x] Interactive hero terminal with a mini-golf game (`golf`)
- [ ] Golf-themed 404 page
- [ ] More projects
