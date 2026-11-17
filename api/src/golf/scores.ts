import { Hono } from "hono";
import { playRound } from "../../../src/lib/golf";
import {
  COURSE_VERSION,
  submissionSchema,
  type LeaderboardEntry,
} from "../../../src/lib/leaderboard";

/** A round of the most putts allowed is about 8 KB of JSON. */
const MAX_BODY_BYTES = 16 * 1024;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

interface Row {
  name: string;
  total: number;
  strokes: string;
  created_at: string;
}

export const scores = new Hono<{ Bindings: Env }>();

/** Top scores on the current course, best first, earliest first among ties. */
scores.get("/scores", async (c) => {
  const asked = Number(c.req.query("limit") ?? DEFAULT_LIMIT);
  const limit = Number.isInteger(asked)
    ? Math.min(MAX_LIMIT, Math.max(1, asked))
    : DEFAULT_LIMIT;

  const { results } = await c.env.LEADERBOARD.prepare(
    `SELECT name, total, strokes, created_at FROM golf_scores
     WHERE course_version = ?1
     ORDER BY total, id
     LIMIT ?2`,
  )
    .bind(COURSE_VERSION, limit)
    .all<Row>();

  const entries: LeaderboardEntry[] = results.map((row, index) => ({
    rank: index + 1,
    name: row.name,
    total: row.total,
    strokes: JSON.parse(row.strokes) as number[],
    createdAt: row.created_at,
  }));
  c.header("Cache-Control", "public, max-age=30");
  return c.json({ scores: entries });
});

/** Replays the posted putts, and stores the score the replay gives. */
scores.post("/scores", async (c) => {
  if (!c.req.header("content-type")?.startsWith("application/json")) {
    return c.json({ error: "Send JSON." }, 415);
  }
  // Check the size before reading the body, then again once it's read, since
  // the header can be missing or wrong.
  const declared = Number(c.req.header("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return c.json({ error: "Too large." }, 413);
  const text = await c.req.text();
  if (text.length > MAX_BODY_BYTES) return c.json({ error: "Too large." }, 413);

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return c.json({ error: "That isn't valid JSON." }, 400);
  }

  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        error: "That score isn't valid.",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      400,
    );
  }
  const { roundId, name, shots } = parsed.data;

  const strokes = playRound(shots);
  if (!strokes) {
    return c.json({ error: "Those putts don't make a finished round." }, 400);
  }
  const total = strokes.reduce((sum, count) => sum + count, 0);

  const db = c.env.LEADERBOARD;
  let id: number;
  try {
    const row = await db
      .prepare(
        `INSERT INTO golf_scores
           (round_id, name, shots, strokes, total, course_version)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)
         RETURNING id`,
      )
      .bind(
        roundId,
        name,
        JSON.stringify(shots),
        JSON.stringify(strokes),
        total,
        COURSE_VERSION,
      )
      .first<{ id: number }>();
    id = row!.id;
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      return c.json({ error: "That round was already posted." }, 409);
    }
    throw error;
  }

  // Rank is one more than the scores that come before it in the ordering.
  const ahead = await db
    .prepare(
      `SELECT COUNT(*) AS n FROM golf_scores
       WHERE course_version = ?1 AND (total < ?2 OR (total = ?2 AND id < ?3))`,
    )
    .bind(COURSE_VERSION, total, id)
    .first<{ n: number }>();

  return c.json({ id, rank: ahead!.n + 1, total }, 201);
});
