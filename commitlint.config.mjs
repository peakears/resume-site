// Commit messages drive the version number (see .releaserc.json), so CI lints
// every commit in a pull request against Conventional Commits.
const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Only the header decides the release. Dependabot quotes upstream release
    // notes into commit bodies, which can run past 100 characters (lines with
    // URLs are already exempt), so body and footer length only warn.
    "body-max-line-length": [1, "always", 100],
    "footer-max-line-length": [1, "always", 100],
  },
};

export default config;
