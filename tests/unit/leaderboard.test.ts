import { describe, expect, it } from "vitest";
import { MAX_SHOTS } from "@/lib/golf";
import { COURSE_VERSION, submissionSchema } from "@/lib/leaderboard";

const valid = {
  roundId: "6f1c2b0e-8a43-4c1d-9d52-3b7d1f0a9e11",
  name: "PAT",
  shots: [{ x: 455, y: 0 }],
  courseVersion: COURSE_VERSION,
};

const check = (changes: Record<string, unknown>) =>
  submissionSchema.safeParse({ ...valid, ...changes });

describe("a leaderboard submission", () => {
  it("accepts a well-formed round", () => {
    expect(check({}).success).toBe(true);
  });

  it.each([
    ["lower case", "pat"],
    ["too short", "PA"],
    ["too long", "PATS"],
    ["digits", "P4T"],
    ["spaces", "P T"],
    ["empty", ""],
    ["a blocked word", "ASS"],
  ])("rejects initials that are %s", (_, name) => {
    expect(check({ name }).success).toBe(false);
  });

  it("rejects a round id that isn't a UUID", () => {
    expect(check({ roundId: "round-1" }).success).toBe(false);
  });

  it("rejects a course version that isn't the current one", () => {
    expect(check({ courseVersion: COURSE_VERSION + 1 }).success).toBe(false);
    expect(check({ courseVersion: undefined }).success).toBe(false);
  });

  it("needs at least one putt and no more than the game allows", () => {
    expect(check({ shots: [] }).success).toBe(false);
    const many = Array.from({ length: MAX_SHOTS + 1 }, () => valid.shots[0]);
    expect(check({ shots: many }).success).toBe(false);
  });

  it("rejects putts that aren't finite numbers", () => {
    expect(check({ shots: [{ x: "455", y: 0 }] }).success).toBe(false);
    expect(check({ shots: [{ x: 1, y: Infinity }] }).success).toBe(false);
    expect(check({ shots: [{ x: 1 }] }).success).toBe(false);
  });

  it("rejects a score sent by the client, and any other unknown field", () => {
    expect(check({ total: 3 }).success).toBe(false);
    expect(check({ strokes: [1, 1, 1] }).success).toBe(false);
    expect(check({ shots: [{ x: 1, y: 0, power: 1 }] }).success).toBe(false);
  });
});
