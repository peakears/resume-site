// Claude Code PostToolUse hook: after an edit that can change the printed
// resume (content, components, page layout or global styles), remind Claude
// to regenerate and commit public/resume.pdf. CI's `resume:check` fails when
// the committed PDF is stale, so this catches it before a push.
// Reminds once per session, so a run of edits doesn't repeat it.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// Paths, relative to the repo root, that feed the page the PDF is printed from.
const AFFECTS_PDF = [
  /^src\/data\//,
  /^src\/components\//,
  /^src\/app\/(page|layout)\.tsx$/,
  /^src\/app\/globals\.css$/,
];

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();

let event;
try {
  event = JSON.parse(readFileSync(0, "utf8"));
} catch {
  process.exit(0);
}

const file = event.tool_input?.file_path;
if (!file) process.exit(0);

const relative = path
  .relative(root, path.resolve(root, file))
  .split(path.sep)
  .join("/");
if (!AFFECTS_PDF.some((pattern) => pattern.test(relative))) process.exit(0);

const sessionId = String(event.session_id ?? "unknown").replace(/\W/g, "");
const marker = path.join(tmpdir(), `resume-pdf-reminder-${sessionId}`);
if (existsSync(marker)) process.exit(0);
writeFileSync(marker, relative);

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext:
        `${relative} feeds the printed resume. Before finishing, run ` +
        "`npm run resume:pdf` (it fails if the PDF is longer than one page) " +
        "and commit public/resume.pdf, or CI's resume:check will fail.",
    },
  }),
);
