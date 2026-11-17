/**
 * Branch naming. A branch is `<type>/<slug>`, where the type is a
 * Conventional Commit type (the same vocabulary that decides the release
 * version, see CLAUDE.md) and the slug is short, lower-case and hyphenated:
 * `feature/golf-leaderboard-api`, `fix/mobile-nav-overlap`.
 *
 * Pure so the hook, CI and unit tests all share one definition.
 */

/** `feature` is the repo's spelling of the `feat` commit type. */
export const BRANCH_TYPES = [
  "feature",
  "fix",
  "perf",
  "refactor",
  "docs",
  "test",
  "ci",
  "build",
  "chore",
  "style",
  "revert",
] as const;

/** Branches that aren't work branches, or that bots name themselves. */
const EXEMPT = [/^main$/, /^develop$/, /^dependabot\//];

const MAX_SLUG_LENGTH = 50;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Returns what is wrong with a branch name, or null if it's fine. */
export function checkBranchName(name: string): string | null {
  if (EXEMPT.some((pattern) => pattern.test(name))) return null;

  const [type, slug, ...rest] = name.split("/");
  const expected = `Use <type>/<short-slug>, with type one of ${BRANCH_TYPES.join(", ")} (e.g. feature/golf-leaderboard-api).`;

  if (slug === undefined || rest.length > 0) {
    return `"${name}" isn't <type>/<slug>. ${expected}`;
  }
  if (!(BRANCH_TYPES as readonly string[]).includes(type)) {
    return `"${name}" starts with "${type}", which isn't a branch type. ${expected}`;
  }
  if (!SLUG.test(slug)) {
    return `"${name}" has a slug that isn't lower-case words joined by single hyphens (letters and digits only). ${expected}`;
  }
  if (slug.length > MAX_SLUG_LENGTH) {
    return `"${name}" has a slug longer than ${MAX_SLUG_LENGTH} characters. Shorten it.`;
  }
  return null;
}
