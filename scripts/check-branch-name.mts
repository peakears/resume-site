/**
 * Checks branch names against src/lib/branchName.ts.
 *
 *   node scripts/check-branch-name.mts <name>...   check the names given (CI)
 *   node scripts/check-branch-name.mts --current   check the checked-out branch
 *   node scripts/check-branch-name.mts --pre-push  check the branches git is
 *                                                  about to push (reads the
 *                                                  refs git writes to stdin)
 *
 * Exits 1 and says what to change if any name is wrong.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { checkBranchName } from "../src/lib/branchName.ts";

const args = process.argv.slice(2);
let names: string[];

if (args[0] === "--pre-push") {
  // Each line: <local ref> <local sha> <remote ref> <remote sha>. Only
  // branches matter: skip tags, and skip deletions (the local sha is all 0s).
  names = readFileSync(0, "utf8")
    .split("\n")
    .map((line) => line.trim().split(/\s+/))
    .filter(
      ([, localSha, remoteRef]) =>
        remoteRef?.startsWith("refs/heads/") && !/^0+$/.test(localSha),
    )
    .map(([, , remoteRef]) => remoteRef.slice("refs/heads/".length));
} else if (args[0] === "--current") {
  names = [
    execFileSync("git", ["branch", "--show-current"], {
      encoding: "utf8",
    }).trim(),
  ].filter(Boolean);
} else {
  names = args;
}

let failed = false;
for (const name of names) {
  const problem = checkBranchName(name);
  if (problem) {
    failed = true;
    console.error(`Branch name: ${problem}`);
  }
}
if (failed) {
  console.error(
    "Rename it with `git branch -m <new-name>` and push again. See README > Branching.",
  );
  process.exit(1);
}
