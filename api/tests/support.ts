import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { getPlatformProxy } from "wrangler";
import {
  LEVELS,
  advance,
  simulateShot,
  strike,
  teeOff,
  type Shot,
  type StepResult,
} from "../../src/lib/golf";
import { COURSE_VERSION } from "../../src/lib/leaderboard";

const API = join(import.meta.dirname, "..");

/**
 * A fresh in-memory D1 database (the same SQLite that Cloudflare runs) with
 * every migration applied, so tests exercise the real schema and constraints.
 */
export async function createEnv() {
  const proxy = await getPlatformProxy<Env>({
    configPath: join(API, "wrangler.jsonc"),
    persist: false,
  });
  const migrations = join(API, "migrations");
  for (const file of readdirSync(migrations).sort()) {
    const sql = readFileSync(join(migrations, file), "utf8")
      .replace(/--.*$/gm, "")
      .split(";")
      .map((statement) => statement.trim())
      .filter(Boolean);
    for (const statement of sql) {
      await proxy.env.LEADERBOARD.prepare(statement).run();
    }
  }
  return { env: proxy.env, dispose: () => proxy.dispose() };
}

/**
 * Plays the real course the way a player would: from where the ball lies,
 * take the putt that holes out, or else the one that gets closest. Returns
 * the putts, in order.
 */
export function playTheCourse(): Shot[] {
  const shots: Shot[] = [];
  for (const level of LEVELS) {
    let state = teeOff(level);
    let result: StepResult = "rolling";
    while (result !== "sunk") {
      let best: { shot: Shot; gap: number; sunk: boolean } | null = null;
      for (let degrees = 0; degrees < 360 && !best?.sunk; degrees += 2) {
        for (let power = 0.1; power <= 1 && !best?.sunk; power += 0.05) {
          const angle = (degrees * Math.PI) / 180;
          const putt = simulateShot(level, state.ball.pos, angle, power);
          if (putt.result === "water") continue;
          const gap = Math.sqrt(
            (putt.pos.x - level.hole.x) ** 2 + (putt.pos.y - level.hole.y) ** 2,
          );
          if (!best || gap < best.gap) {
            const speed = power * 700;
            best = {
              shot: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
              gap,
              sunk: putt.result === "sunk",
            };
          }
        }
      }
      shots.push(best!.shot);
      state = strike(state, best!.shot);
      result = "rolling";
      while (result === "rolling") ({ state, result } = advance(level, state));
    }
  }
  return shots;
}

export const validSubmission = (changes: Record<string, unknown> = {}) => ({
  roundId: crypto.randomUUID(),
  name: "PAT",
  shots: playTheCourse(),
  courseVersion: COURSE_VERSION,
  ...changes,
});
