import type { Link, Role, SkillGroup } from "@/data/profile";
import { formatDateRange, formatYearMonth } from "./dates";

/** The profile content the hero terminal can print. */
export interface TerminalData {
  aboutHeadline: string;
  email: string;
  socials: Link[];
  resumePdf: string;
  /** The resume in JSON Resume format (served by src/app/resume.json). */
  resumeJson: string;
  hubUrl: string;
  skills: SkillGroup[];
  experience: Role[];
}

export type TerminalLine =
  | { kind: "command" | "output" | "muted" | "error"; text: string }
  | {
      kind: "link";
      text: string;
      href: string;
      download?: boolean;
      external?: boolean;
    };

export interface CommandResult {
  lines: TerminalLine[];
  /** Something the terminal should do besides printing. */
  action?: "clear" | "golf";
}

export const COMMANDS = [
  { name: "help", description: "list commands" },
  { name: "about", description: "who I am" },
  { name: "experience", description: "where I've worked" },
  { name: "git log", description: "my career, as commits" },
  { name: "skills", description: "what I work with" },
  { name: "contact", description: "how to reach me" },
  { name: "resume", description: "download my resume (PDF or JSON)" },
  { name: "hub", description: "all my links, on one page" },
  { name: "golf", description: "play a quick round of mini golf" },
  { name: "clear", description: "clear the screen" },
] as const;

const out = (text: string): TerminalLine => ({ kind: "output", text });

/** A stable 7-character "commit hash" for a role (FNV-1a, not cryptographic). */
function shortHash(text: string): string {
  let hash = 0x811c9dc5;
  for (const char of text) {
    hash ^= char.codePointAt(0)!;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0").slice(0, 7);
}

/** Roles as a one-line git log: newest first, the current role at HEAD. */
function gitLog(experience: Role[]): TerminalLine[] {
  const oldestFirst = [...experience].sort((a, b) =>
    a.start.localeCompare(b.start),
  );
  const lines = oldestFirst.map((role, i): TerminalLine => {
    const previous = oldestFirst[i - 1];
    const message = !previous
      ? `chore: start career as ${role.title} @ ${role.company}`
      : previous.company === role.company
        ? `feat: promoted to ${role.title} @ ${role.company}`
        : `feat: join ${role.company} as ${role.title}`;
    const head = role.end === null ? "(HEAD -> main) " : "";
    return out(
      `${shortHash(role.company + role.start)} ${head}${formatYearMonth(role.start)}  ${message}`,
    );
  });
  return lines.reverse();
}

/**
 * Tab completion: extends `input` to the longest prefix shared by every
 * command it could be, or returns it unchanged when there's nothing to add.
 */
export function completeCommand(input: string): string {
  const typed = input.trimStart().toLowerCase();
  if (!typed) return input;
  const matches = COMMANDS.map((c): string => c.name).filter((name) =>
    name.startsWith(typed),
  );
  if (matches.length === 0) return input;
  let prefix = matches[0];
  for (const name of matches.slice(1)) {
    while (!name.startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  return prefix.length > typed.length ? prefix : input;
}

/** Runs one line typed into the terminal. */
export function runCommand(input: string, data: TerminalData): CommandResult {
  const [command = "", ...args] = input.trim().toLowerCase().split(/\s+/);

  switch (command) {
    case "":
      return { lines: [] };
    case "help": {
      const width = Math.max(...COMMANDS.map((c) => c.name.length));
      return {
        lines: COMMANDS.map((c) =>
          out(`${c.name.padEnd(width)}  ${c.description}`),
        ),
      };
    }
    case "about":
    case "whoami":
      return { lines: [out(data.aboutHeadline)] };
    case "experience":
      return {
        lines: data.experience.map((role) =>
          out(
            `${role.title} @ ${role.company} (${formatDateRange(role.start, role.end)})`,
          ),
        ),
      };
    case "git":
      if (args[0] === "log") return { lines: gitLog(data.experience) };
      return {
        lines: [
          {
            kind: "error",
            text: args[0]
              ? `git: '${args[0]}' is not a git command. Try 'git log'.`
              : "usage: git log",
          },
        ],
      };
    case "skills": {
      const featured = data.skills.filter((group) => group.featured);
      return {
        lines: (featured.length > 0 ? featured : data.skills).map((group) =>
          out(`${group.category}: ${group.skills.join(", ")}`),
        ),
      };
    }
    case "contact":
      return {
        lines: [
          {
            kind: "link",
            text: data.email,
            href: `mailto:${data.email}`,
          },
          ...data.socials.map((social): TerminalLine => ({
            kind: "link",
            text: social.label,
            href: social.href,
            external: true,
          })),
        ],
      };
    case "resume":
      return {
        lines: [
          {
            kind: "link",
            text: "Download resume (PDF)",
            href: data.resumePdf,
            download: true,
          },
          { kind: "link", text: "resume.json", href: data.resumeJson },
        ],
      };
    case "hub":
      return {
        lines: [
          {
            kind: "link",
            text: new URL(data.hubUrl).host,
            href: data.hubUrl,
          },
        ],
      };
    case "golf":
      return {
        lines: [{ kind: "muted", text: "Teeing up… ⛳" }],
        action: "golf",
      };
    case "clear":
      return { lines: [], action: "clear" };
    case "sudo":
      return {
        lines: [
          {
            kind: "error",
            text:
              args[0] === "hire"
                ? "Permission granted. Type 'contact' to finish the job. 😉"
                : "Nice try. This incident will be reported. 😉",
          },
        ],
      };
    default:
      return {
        lines: [
          {
            kind: "error",
            text: `command not found: ${command}. Type 'help' for a list.`,
          },
        ],
      };
  }
}
