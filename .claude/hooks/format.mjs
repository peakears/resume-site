// Claude Code PostToolUse hook: run Prettier on the file Claude just edited or
// wrote, so its changes match `npm run format` without a separate pass.
// Registered in .claude/settings.json. It never fails the tool call: CI's
// format check is still the gate.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();

let file;
try {
  file = JSON.parse(readFileSync(0, "utf8")).tool_input?.file_path;
} catch {
  process.exit(0);
}

const relative = file ? path.relative(root, path.resolve(root, file)) : "";
const insideRepo =
  relative && !relative.startsWith("..") && !path.isAbsolute(relative);
const prettier = path.join(root, "node_modules", ".bin", "prettier");

// Skip files outside the repo (scratch files, other projects) and checkouts
// where dependencies aren't installed yet.
if (insideRepo && existsSync(prettier)) {
  // --ignore-unknown skips files Prettier can't parse (PDFs, images);
  // running from the root applies .prettierrc.json and .prettierignore.
  const result = spawnSync(
    prettier,
    ["--write", "--ignore-unknown", "--log-level", "warn", relative],
    { cwd: root, encoding: "utf8" },
  );
  if (result.status !== 0) {
    process.stderr.write(
      `Prettier could not format ${relative}:\n${result.stderr}`,
    );
  }
}
