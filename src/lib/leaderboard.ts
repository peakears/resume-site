/**
 * What the game posts to the leaderboard, and the rules both sides share.
 * No dependencies, so the game and the terminal can import it without
 * loading the validation library: that lives in leaderboardSchema.ts, which
 * only the API Worker uses, and builds on the rules here.
 */
import type { Shot } from "./golf";

/**
 * Bump when a level or a physics constant changes. Putts only mean the same
 * thing on the course they were played on, so scores from an older course
 * are refused (and kept apart on the board) instead of replayed wrongly.
 */
export const COURSE_VERSION = 1;

/** Three-letter initials that can't go on the board. */
const BLOCKED_NAMES = new Set(["ASS", "FAG", "FUK", "KKK", "NZI", "SEX"]);

/** What is wrong with a set of initials, or null if they're fine. */
export function nameProblem(name: string): string | null {
  if (!/^[A-Z]{3}$/.test(name)) return "Use three capital letters, A to Z.";
  if (BLOCKED_NAMES.has(name)) return "Pick different initials.";
  return null;
}

/**
 * A round as posted. There is deliberately no score in it: the server
 * replays `shots` and works out the strokes and the total itself.
 */
export interface Submission {
  /** Made by the browser when a round starts, so a retry can't post twice. */
  roundId: string;
  name: string;
  shots: Shot[];
  courseVersion: number;
}

/** One row of the leaderboard as the API returns it. */
export interface LeaderboardEntry {
  rank: number;
  name: string;
  total: number;
  strokes: number[];
  createdAt: string;
}
