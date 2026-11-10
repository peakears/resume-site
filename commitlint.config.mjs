// Commit messages drive the version number (see .releaserc.json), so CI lints
// every commit in a pull request against Conventional Commits.
const config = { extends: ["@commitlint/config-conventional"] };

export default config;
