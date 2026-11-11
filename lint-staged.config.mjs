// Runs on `git commit` (via .husky/pre-commit) against staged files only.
// Each file matches exactly one pattern, so two tools never write the same
// file at once. Fixes are added to the commit; anything that can't be fixed
// stops it. CI runs the full checks either way.
const code = "*.{js,mjs,cjs,ts,tsx,mts,cts}";
const notCode = "!(*.{js,mjs,cjs,ts,tsx,mts,cts})";

const config = {
  // Lint first, then format, so Prettier has the last word on layout.
  // --no-warn-ignored: don't warn about staged files ESLint is set to ignore.
  [code]: ["eslint --fix --no-warn-ignored", "prettier --write"],
  // Everything else: --ignore-unknown skips files Prettier can't parse (PDFs,
  // images); .prettierignore still applies.
  [notCode]: "prettier --write --ignore-unknown",
};

export default config;
