/**
 * What the game posts to the leaderboard, and the rules for accepting it.
 * One schema, used by the game (to check before sending) and by the API
 * Worker (to check what arrives). Nothing here may rely on the browser.
 */
import { z } from "zod";
import { MAX_SHOTS } from "./golf";

/**
 * Bump when a level or a physics constant changes. Putts only mean the same
 * thing on the course they were played on, so scores from an older course
 * are refused (and kept apart on the board) instead of replayed wrongly.
 */
export const COURSE_VERSION = 1;

/** Three-letter initials that can't go on the board. */
const BLOCKED_NAMES = new Set(["ASS", "FAG", "FUK", "KKK", "NZI", "SEX"]);

export const nameSchema = z
  .string()
  .regex(/^[A-Z]{3}$/, "Use three capital letters, A to Z.")
  .refine((name) => !BLOCKED_NAMES.has(name), "Pick different initials.");

/** A putt is its launch velocity; the server replays it with golf.ts. */
export const shotSchema = z.strictObject({
  x: z.number().finite(),
  y: z.number().finite(),
});

/**
 * A round as posted. There is deliberately no score in it: the server
 * replays `shots` and works out the strokes and the total itself.
 */
export const submissionSchema = z.strictObject({
  /** Made by the browser when a round starts, so a retry can't post twice. */
  roundId: z.uuid(),
  name: nameSchema,
  shots: z.array(shotSchema).min(1).max(MAX_SHOTS),
  courseVersion: z.literal(COURSE_VERSION),
});

export type Submission = z.infer<typeof submissionSchema>;

/** One row of the leaderboard as the API returns it. */
export interface LeaderboardEntry {
  rank: number;
  name: string;
  total: number;
  strokes: number[];
  createdAt: string;
}
