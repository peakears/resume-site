# 0001: Initial stack

**Status:** Accepted, November 2026

## Context

A personal resume site: a single static page, free to host, that also shows good engineering practice in the repo itself.

## Decisions

- **Next.js App Router with static export.** Server Components run at build time and the output is plain HTML/CSS/JS in `out/`. Any static host works, and there's no server to pay for or secure. If a backend is needed later (e.g. a contact form), static export can be turned off.
- **TypeScript in strict mode.** The resume content is typed (`Profile` in `src/data/profile.ts`), so a missing field is a compile error rather than a blank spot on the page.
- **Tailwind CSS v4 with CSS-variable design tokens.** Light and dark themes are one set of variables each. Theme is a `dark` class on `<html>`, set by an inline script before hydration to avoid a flash of the wrong theme.
- **Vitest + React Testing Library for unit tests.** Fast and works natively with TS/ESM. Async Server Components aren't supported by Vitest, so components are kept synchronous and covered by E2E where needed.
- **Playwright for integration/E2E tests,** run against the real production build rather than the dev server, so tests see exactly what visitors get. axe-core runs accessibility scans in both themes.
- **Prettier with the Tailwind plugin,** so class order is consistent and diffs stay small.

## Consequences

- No runtime features that need a server (Server Actions, ISR, default image optimization).
- E2E tests do a full build first, so they take a few seconds longer than tests against `next dev`.
