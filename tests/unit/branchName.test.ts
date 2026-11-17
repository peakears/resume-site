import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

  // Each case builds its own repository, so the result doesn't depend on
  // where the tests run (CI checks out pull requests on a detached HEAD).
  describe("--current", () => {
    const script = join(process.cwd(), "scripts/check-branch-name.mts");
    const inRepo = (setup: (git: (...args: string[]) => void) => void) => {
      const dir = mkdtempSync(join(tmpdir(), "branch-name-"));
      const git = (...args: string[]) => {
        execFileSync(
          "git",
          [
            "-c",
            "user.name=Test",
            "-c",
            "user.email=test@example.com",
            "-c",
            "commit.gpgsign=false",
            ...args,
          ],
          { cwd: dir, stdio: "ignore" },
        );
      };
      try {
        setup(git);
        return spawnSync("node", [script, "--current"], {
          cwd: dir,
          encoding: "utf8",
        });
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    };

    it("passes a branch with a good name", () => {
      const result = inRepo((git) => git("init", "-q", "-b", "feature/ok"));
      expect(result.status).toBe(0);
    });

    it("fails a branch with a bad name", () => {
      const result = inRepo((git) => git("init", "-q", "-b", "my-branch"));
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('"my-branch"');
    });

    it("passes on a detached HEAD, which has no branch name", () => {
      const result = inRepo((git) => {
        git("init", "-q", "-b", "my-branch");
        git("commit", "-q", "--allow-empty", "-m", "first");
        git("checkout", "-q", "--detach");
      });
      expect(result.status).toBe(0);
    });
  });
});
