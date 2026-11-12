import type { Link, Role, SkillGroup } from "@/data/profile";
import { formatDateRange } from "./dates";
import type { LeaderboardEntry } from "./leaderboard";

/** The profile content the hero terminal can print. */
export interface TerminalData {
  aboutHeadline: string;
  email: string;
  socials: Link[];
  resumePdf: string;
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
  action?: "clear" | "golf" | "leaderboard";
}

export const COMMANDS = [
  { name: "help", description: "list commands" },
  { name: "about", description: "who I am" },
  { name: "experience", description: "where I've worked" },
  { name: "skills", description: "what I work with" },
  { name: "contact", description: "how to reach me" },
  { name: "resume", description: "download my resume (PDF)" },
  { name: "hub", description: "all my links, on one page" },
  { name: "golf", description: "play a quick round of mini golf" },
  { name: "leaderboard", description: "see the top mini golf scores" },
  { name: "clear", description: "clear the screen" },
] as const;

const out = (text: string): TerminalLine => ({ kind: "output", text });

/**
 * The lines the `leaderboard` command prints once the scores arrive. `entries`
 * is null when the leaderboard can't be reached.
 */
export function leaderboardLines(
  entries: LeaderboardEntry[] | null,
): TerminalLine[] {
  if (entries === null) {
    return [{ kind: "error", text: "Leaderboard unavailable." }];
  }
  if (entries.length === 0) {
    return [
      { kind: "muted", text: "No scores yet. Type 'golf' to post the first." },
    ];
  }
  return entries.map((entry) =>
    out(
      `${entry.rank}. ${entry.name}  ${entry.total} strokes  [${entry.strokes.join("-")}]`,
    ),
  );
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
    case "leaderboard":
      return {
        lines: [{ kind: "muted", text: "Fetching the top scores…" }],
        action: "leaderboard",
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
