@AGENTS.md

# Project notes for Claude

Personal resume site. Next.js 16 App Router, statically exported (`output: "export"`), so no server-only features: no Server Actions, route handlers with dynamic data, or default `next/image` optimization.

## Conventions

- All content lives in `src/data/profile.ts`. Components take data as props and never import the profile directly, except `src/app/page.tsx` and `layout.tsx`.
- Colours come from CSS variables in `src/app/globals.css` (`bg-background`, `text-muted`, `border-border`, `bg-accent`, ...). Don't hard-code Tailwind palette colours; dark mode works by redefining the variables under `.dark`.
- A `PostToolUse` hook (`.claude/settings.json` → `.claude/hooks/format.mjs`) runs Prettier on every file you edit or write, so there is no need to run `npm run format` after edits. If a later `Edit` misses because the hook reformatted the file, re-read it first.
- Every new component gets a unit test in `tests/unit/` that queries by role and accessible name.
- User-visible behaviour (navigation, theme, layout) gets a Playwright test in `tests/e2e/`.

- Print styles (`print:` variants) turn the page into the one-page PDF resume. After changing content or layout, run `npm run resume:pdf` (it fails if the PDF isn't one page) and commit the PDF. CI's `resume:check` fails if the committed PDF is stale. A `PostToolUse` hook (`.claude/hooks/resume-pdf-reminder.mjs`) reminds you once per session when you edit a file that feeds the PDF.

## Before finishing a change

Run `npm run check` (typecheck, lint, format check, unit tests, E2E). It must pass.

## Git

Work on `feature/*` branches off `develop` and open a PR into `develop`. Use Conventional Commit messages (see Versioning below). `main` and `develop` are protected; never push to them directly. CI (`.github/workflows/ci.yml`) must pass before merging.

## Versioning and releases

The site uses semver, released automatically by semantic-release (`.github/workflows/release.yml`, config in `.releaserc.json`) whenever `develop` merges into `main`. It tags `vX.Y.Z` and publishes a GitHub Release whose notes are built from commit messages, with the resume PDF attached. Commit messages are therefore the changelog:

- `feat:` → minor release. Use it for new or changed resume content and new site features.
- `fix:` or `perf:` → patch release. Use it for corrections (typos, wrong dates, broken layout) and performance work.
- `feat!:` or a `BREAKING CHANGE:` footer → major release. Reserve it for a deliberate overhaul.
- `docs:`, `test:`, `ci:`, `build:`, `refactor:`, `style:`, `chore:` → no release on their own and hidden from the notes.
- Write the subject for a reader of the release notes: lower-case, imperative, no trailing period, e.g. `feat: add Secrets Manager to the CARFAX role`.
- A husky `commit-msg` hook runs commitlint on every commit, and `pre-commit` runs lint-staged (ESLint `--fix` + Prettier on staged files). If a commit is rejected, fix the message or the lint error and commit again; never use `--no-verify`. CI's commitlint job checks the whole PR as well (`npm run commitlint` locally).
- Merge PRs with merge commits, not squash, so each commit appears in the notes.
- Never create tags or releases by hand, never edit `version` in `package.json` (it's a placeholder), and don't add a `CHANGELOG.md`. Tags and GitHub Releases are the source of truth.
