# resume-site

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

| Script                  | What it does                                             |
| ----------------------- | -------------------------------------------------------- |
| `npm run dev`           | Start the dev server with hot reload                     |
| `npm run build`         | Build the static site into `out/`                        |
| `npm run preview`       | Serve `out/` locally on port 4173                        |
| `npm test`              | Run unit tests (Vitest + React Testing Library)          |
| `npm run test:watch`    | Run unit tests in watch mode                             |
| `npm run test:coverage` | Unit tests with a coverage report                        |
| `npm run test:e2e`      | Build, serve and run Playwright tests (desktop + mobile) |
| `npm run typecheck`     | TypeScript in strict mode                                |
| `npm run lint`          | ESLint (Next.js core-web-vitals + TypeScript rules)      |
| `npm run format`        | Format with Prettier (with Tailwind class sorting)       |
| `npm run check`         | Everything above, the same gate CI will run              |

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

## Testing strategy

- **Unit (Vitest + React Testing Library):** pure helpers and each section component, rendered with a fixture profile. Queries use roles and accessible names, the way a user or screen reader finds things.
- **Integration/E2E (Playwright):** runs against the production static build served from `out/`, on desktop Chrome and a mobile viewport. It covers page content, in-page navigation, theme persistence, OS colour-scheme detection, no horizontal scroll, no console errors, and **axe accessibility scans in light and dark mode**.

## Branching

- `main`: production. Only updated by merging `develop`.
- `develop`: integration branch.
- `feature/*`, `fix/*`: short-lived branches, merged into `develop` through a PR.

Commits follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `test:`, `docs:`, `chore:`).

## Roadmap

- [ ] Fill in real resume content
- [ ] GitHub Actions CI running `npm run check` on every PR
- [ ] Branch protection on `main`
- [ ] Deploy (Vercel, Cloudflare Pages or GitHub Pages) on a custom domain
