import { execFileSync, spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { BRANCH_TYPES, checkBranchName } from "@/lib/branchName";

describe("checkBranchName", () => {
  it.each([
    "feature/golf-leaderboard-api",
    "fix/mobile-nav-overlap",
    "docs/adr-0005",
    "chore/bump-next",
    "feature/a",
  ])("accepts %s", (name) => {
    expect(checkBranchName(name)).toBeNull();
  });

  it.each(BRANCH_TYPES)("accepts the %s type", (type) => {
    expect(checkBranchName(`${type}/something`)).toBeNull();
  });

  it.each(["main", "develop", "dependabot/npm_and_yarn/develop/zod-4.7.0"])(
    "leaves %s alone",
    (name) => {
      expect(checkBranchName(name)).toBeNull();
    },
  );

  it.each([
    ["ccr-4eb2630c-nharb5", "isn't <type>/<slug>"],
    ["golf-leaderboard", "isn't <type>/<slug>"],
    ["feature/golf/leaderboard", "isn't <type>/<slug>"],
    ["feature", "isn't <type>/<slug>"],
    ["feat/golf", "isn't a branch type"],
    ["hotfix/golf", "isn't a branch type"],
    ["Feature/golf", "isn't a branch type"],
    ["feature/", "slug"],
    ["feature/Golf", "slug"],
    ["feature/golf_leaderboard", "slug"],
    ["feature/golf--leaderboard", "slug"],
    ["feature/-golf", "slug"],
    ["feature/golf-", "slug"],
    ["feature/golf leaderboard", "slug"],
    [`feature/${"a".repeat(51)}`, "longer than 50"],
  ])("rejects %s", (name, why) => {
    expect(checkBranchName(name)).toContain(why);
  });

  it("says what a good name looks like", () => {
    expect(checkBranchName("wip")).toContain("feature/golf-leaderboard-api");
  });
});

describe("scripts/check-branch-name.mts", () => {
  const run = (args: string[], input = "") =>
    spawnSync("node", ["scripts/check-branch-name.mts", ...args], {
      input,
      encoding: "utf8",
    });
  const sha = "a".repeat(40);

  it("passes good names and fails bad ones", () => {
    expect(run(["feature/ok", "fix/ok-too"]).status).toBe(0);
    const bad = run(["feature/ok", "nope"]);
    expect(bad.status).toBe(1);
    expect(bad.stderr).toContain('"nope"');
  });

  it("checks the branches a push would create", () => {
    const push = (ref: string, local = sha) =>
      run(["--pre-push"], `refs/heads/x ${local} ${ref} ${"0".repeat(40)}\n`);
    expect(push("refs/heads/feature/ok").status).toBe(0);
    expect(push("refs/heads/ccr-1234").status).toBe(1);
  });

  it("ignores tags and deletions when pushing", () => {
    const zeros = "0".repeat(40);
    expect(
      run(["--pre-push"], `refs/tags/v1 ${sha} refs/tags/v1 ${zeros}\n`).status,
    ).toBe(0);
    expect(
      run(["--pre-push"], `(delete) ${zeros} refs/heads/old-name ${sha}\n`)
        .status,
    ).toBe(0);
    expect(run(["--pre-push"], "").status).toBe(0);
  });

  it("checks the current branch", () => {
    const branch = execFileSync("git", ["branch", "--show-current"], {
      encoding: "utf8",
    }).trim();
    // Detached HEAD in some CI checkouts gives no name, which passes.
    expect(run(["--current"]).status).toBe(checkBranchName(branch) ? 1 : 0);
  });
});
