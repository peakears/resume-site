import { describe, expect, it } from "vitest";
import {
  COMMANDS,
  leaderboardLines,
  runCommand,
  type TerminalData,
} from "@/lib/terminal";

const data: TerminalData = {
  aboutHeadline: "Engineer who builds things.",
  email: "jane@example.com",
  socials: [{ label: "GitHub", href: "https://github.com/jane" }],
  resumePdf: "/resume.pdf",
  hubUrl: "https://jane.example",
  skills: [
    { category: "Languages", skills: ["Java", "Go"], featured: true },
    { category: "Tools", skills: ["Git"] },
  ],
  experience: [
    {
      company: "Acme",
      title: "Engineer",
      location: "Remote",
      start: "2023-02",
      end: null,
      highlights: [],
      tech: [],
    },
  ],
};

const texts = (input: string) =>
  runCommand(input, data).lines.map((line) => line.text);

describe("runCommand", () => {
  it("lists every command in help", () => {
    const help = texts("help");
    expect(help).toHaveLength(COMMANDS.length);
    for (const command of COMMANDS) {
      expect(help.some((line) => line.startsWith(command.name))).toBe(true);
    }
  });

  it("ignores case and extra spaces", () => {
    expect(texts("  ABOUT  ")).toEqual(["Engineer who builds things."]);
  });

  it("prints roles with their dates", () => {
    expect(texts("experience")).toEqual([
      "Engineer @ Acme (Feb 2023 – Present)",
    ]);
  });

  it("prints only featured skill groups", () => {
    expect(texts("skills")).toEqual(["Languages: Java, Go"]);
  });

  it("links contact details, opening socials in a new tab", () => {
    expect(runCommand("contact", data).lines).toEqual([
      {
        kind: "link",
        text: "jane@example.com",
        href: "mailto:jane@example.com",
      },
      {
        kind: "link",
        text: "GitHub",
        href: "https://github.com/jane",
        external: true,
      },
    ]);
  });

  it("offers the resume as a download", () => {
    expect(runCommand("resume", data).lines[0]).toMatchObject({
      kind: "link",
      href: "/resume.pdf",
      download: true,
    });
  });

  it("links to the hub page", () => {
    expect(runCommand("hub", data).lines).toEqual([
      { kind: "link", text: "jane.example", href: "https://jane.example" },
    ]);
  });

  it("asks the terminal to fetch the leaderboard", () => {
    const result = runCommand("leaderboard", data);
    expect(result.action).toBe("leaderboard");
    expect(result.lines).toEqual([
      { kind: "muted", text: "Fetching the top scores…" },
    ]);
  });

  it("starts the golf game and clears the screen", () => {
    expect(runCommand("golf", data).action).toBe("golf");
    expect(runCommand("clear", data)).toEqual({ lines: [], action: "clear" });
  });

  it("prints nothing for an empty line", () => {
    expect(runCommand("   ", data)).toEqual({ lines: [] });
  });

  it("explains unknown commands", () => {
    expect(runCommand("rm -rf /", data).lines).toEqual([
      { kind: "error", text: "command not found: rm. Type 'help' for a list." },
    ]);
  });

  it("has an easter egg for sudo", () => {
    expect(texts("sudo hire")[0]).toMatch(/Permission granted/);
    expect(texts("sudo ls")[0]).toMatch(/Nice try/);
  });
});

describe("leaderboardLines", () => {
  it("prints one line per score, with the strokes on each hole", () => {
    const lines = leaderboardLines([
      { rank: 1, name: "ACE", total: 8, strokes: [2, 3, 3], createdAt: "a" },
      { rank: 2, name: "PAT", total: 10, strokes: [3, 3, 4], createdAt: "b" },
    ]);
    expect(lines).toEqual([
      { kind: "output", text: "1. ACE  8 strokes  [2-3-3]" },
      { kind: "output", text: "2. PAT  10 strokes  [3-3-4]" },
    ]);
  });

  it("says when there are no scores yet", () => {
    expect(leaderboardLines([])).toEqual([
      { kind: "muted", text: "No scores yet. Type 'golf' to post the first." },
    ]);
  });

  it("says when the leaderboard can't be reached", () => {
    expect(leaderboardLines(null)).toEqual([
      { kind: "error", text: "Leaderboard unavailable." },
    ]);
  });
});
