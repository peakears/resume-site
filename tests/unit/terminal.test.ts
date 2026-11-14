import { describe, expect, it } from "vitest";
import {
  COMMANDS,
  completeCommand,
  runCommand,
  type TerminalData,
} from "@/lib/terminal";

const data: TerminalData = {
  aboutHeadline: "Engineer who builds things.",
  email: "jane@example.com",
  socials: [{ label: "GitHub", href: "https://github.com/jane" }],
  resumePdf: "/resume.pdf",
  resumeJson: "/resume.json",
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
    expect(runCommand("resume", data).lines[1]).toMatchObject({
      kind: "link",
      text: "resume.json",
      href: "/resume.json",
    });
  });

  it("links to the hub page", () => {
    expect(runCommand("hub", data).lines).toEqual([
      { kind: "link", text: "jane.example", href: "https://jane.example" },
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

describe("git log", () => {
  const career: TerminalData = {
    ...data,
    experience: [
      { ...data.experience[0], company: "Beta", start: "2024-05", end: null },
      {
        ...data.experience[0],
        company: "Acme",
        start: "2021-03",
        end: "2022-12",
      },
      {
        ...data.experience[0],
        company: "Acme",
        title: "Senior Engineer",
        start: "2023-01",
        end: "2024-04",
      },
    ],
  };

  it("lists roles newest first, with the current one at HEAD", () => {
    const log = runCommand("git log", career).lines.map((l) => l.text);
    expect(log).toHaveLength(3);
    expect(log[0]).toMatch(
      /^[0-9a-f]{7} \(HEAD -> main\) May 2024 {2}feat: join Beta as Engineer$/,
    );
    expect(log[1]).toMatch(
      /Jan 2023 {2}feat: promoted to Senior Engineer @ Acme$/,
    );
    expect(log[2]).toMatch(
      /Mar 2021 {2}chore: start career as Engineer @ Acme$/,
    );
    expect(log[2]).not.toContain("HEAD");
  });

  it("gives each role a stable hash", () => {
    expect(texts("git log")).toEqual(texts("git log"));
  });

  it("explains other git commands", () => {
    expect(texts("git push")).toEqual([
      "git: 'push' is not a git command. Try 'git log'.",
    ]);
    expect(texts("git")).toEqual(["usage: git log"]);
  });
});

describe("completeCommand", () => {
  it("completes a unique prefix", () => {
    expect(completeCommand("exp")).toBe("experience");
    expect(completeCommand("gi")).toBe("git log");
    expect(completeCommand("RES")).toBe("resume");
  });

  it("leaves ambiguous, unknown, empty and complete input alone", () => {
    expect(completeCommand("g")).toBe("g");
    expect(completeCommand("zzz")).toBe("zzz");
    expect(completeCommand("")).toBe("");
    expect(completeCommand("help")).toBe("help");
  });
});
