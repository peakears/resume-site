import type { Link, Role, SkillGroup } from "@/data/profile";
import { formatDateRange } from "./dates";

/** The profile content the hero terminal can print. */
export interface TerminalData {
  aboutHeadline: string;
  email: string;
  socials: Link[];
  resumePdf: string;
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
  { name: "skills", description: "what I work with" },
  { name: "contact", description: "how to reach me" },
  { name: "resume", description: "download my resume (PDF)" },
  { name: "golf", description: "play a quick round of mini golf" },
  { name: "clear", description: "clear the screen" },
] as const;

const out = (text: string): TerminalLine => ({ kind: "output", text });

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
