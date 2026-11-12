/**
 * Calls the leaderboard API. The API is a separate Worker on the same
 * domain, so the path starts at the site root, not at the /resume base path.
 * Anything that goes wrong reaching it comes back as "unavailable", so the
 * game keeps working when the API is down or isn't there (`next dev`).
 */
import type { LeaderboardEntry, Submission } from "./leaderboard";

export const SCORES_URL = "/api/golf/scores";

export type PostResult =
  | { status: "saved"; id: number; rank: number; total: number }
  /** The server refused this round (invalid, or already posted). */
  | { status: "rejected"; message: string }
  | { status: "limited"; message: string }
  | { status: "unavailable" };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const messageFrom = (body: unknown, fallback: string) =>
  isObject(body) && typeof body.error === "string" ? body.error : fallback;

/** A random id for a round, made when it starts. */
export function newRoundId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  // Older browsers, and pages that aren't served over HTTPS.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Posts a finished round. */
export async function postScore(submission: Submission): Promise<PostResult> {
  let response: Response;
  try {
    response = await fetch(SCORES_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(submission),
    });
  } catch {
    return { status: "unavailable" };
  }
  const body: unknown = await response.json().catch(() => null);

  if (response.status === 201 && isObject(body)) {
    const { id, rank, total } = body;
    if (
      typeof id === "number" &&
      typeof rank === "number" &&
      typeof total === "number"
    ) {
      return { status: "saved", id, rank, total };
    }
  }
  if (response.status === 400 || response.status === 409) {
    return {
      status: "rejected",
      message: messageFrom(body, "That score couldn't be saved."),
    };
  }
  if (response.status === 429) {
    return {
      status: "limited",
      message: messageFrom(body, "Too many scores posted. Try again soon."),
    };
  }
  return { status: "unavailable" };
}

/**
 * The top scores, or null when the leaderboard can't be reached. `fresh`
 * skips the browser's 30-second cache, for reading it right after posting.
 */
export async function getScores(
  limit = 10,
  { fresh = false, signal }: { fresh?: boolean; signal?: AbortSignal } = {},
): Promise<LeaderboardEntry[] | null> {
  try {
    const response = await fetch(`${SCORES_URL}?limit=${limit}`, {
      cache: fresh ? "reload" : "default",
      signal,
    });
    if (!response.ok) return null;
    const body: unknown = await response.json();
    if (!isObject(body) || !Array.isArray(body.scores)) return null;
    return body.scores as LeaderboardEntry[];
  } catch {
    return null;
  }
}
