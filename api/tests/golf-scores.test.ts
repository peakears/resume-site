import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import app from "../src/index";
import { createEnv, playTheCourse, validSubmission } from "./support";

let env: Env;
let dispose: () => Promise<void>;
const round = playTheCourse();

beforeAll(async () => {
  ({ env, dispose } = await createEnv());
});
afterAll(() => dispose());
beforeEach(async () => {
  await env.LEADERBOARD.prepare("DELETE FROM golf_scores").run();
});

const post = async (body: unknown, headers: Record<string, string> = {}) =>
  await app.request(
    "/api/golf/scores",
    {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    },
    env,
  );
const list = async (query = "") =>
  await app.request(`/api/golf/scores${query}`, {}, env);

describe("POST /api/golf/scores", () => {
  it("replays the putts and saves the score it works out", async () => {
    const response = await post(validSubmission({ shots: round }));
    expect(response.status).toBe(201);
    const saved = (await response.json()) as { rank: number; total: number };
    expect(saved).toMatchObject({ rank: 1 });
    expect(saved.total).toBeGreaterThanOrEqual(3);

    const board = (await (await list()).json()) as {
      scores: { name: string; total: number; strokes: number[] }[];
    };
    expect(board.scores).toHaveLength(1);
    expect(board.scores[0].name).toBe("PAT");
    expect(board.scores[0].strokes).toHaveLength(3);
    expect(board.scores[0].total).toBe(saved.total);
  });

  it("ranks later scores behind an equal one", async () => {
    await post(validSubmission({ shots: round }));
    const second = await post(validSubmission({ shots: round, name: "ZED" }));
    expect(((await second.json()) as { rank: number }).rank).toBe(2);
  });

  it("refuses the same round twice", async () => {
    const body = validSubmission({ shots: round });
    expect((await post(body)).status).toBe(201);
    const again = await post(body);
    expect(again.status).toBe(409);
    expect(await list().then((r) => r.json())).toMatchObject({
      scores: [expect.anything()],
    });
  });

  it("refuses putts that don't finish a round", async () => {
    const response = await post(validSubmission({ shots: round.slice(0, -1) }));
    expect(response.status).toBe(400);
  });

  it("refuses putts the game wouldn't allow", async () => {
    const cheat = [{ x: 100000, y: 0 }, ...round.slice(1)];
    expect((await post(validSubmission({ shots: cheat }))).status).toBe(400);
  });

  it("lists what was wrong with a submission", async () => {
    const response = await post(validSubmission({ name: "pat" }));
    expect(response.status).toBe(400);
    const body = (await response.json()) as {
      issues: { path: string; message: string }[];
    };
    expect(body.issues[0].path).toBe("name");
  });

  it("refuses a score sent by the client", async () => {
    const response = await post(validSubmission({ total: 3 }));
    expect(response.status).toBe(400);
  });

  it("refuses anything that isn't JSON", async () => {
    expect((await post("{", {})).status).toBe(400);
    const text = await post("hello", { "content-type": "text/plain" });
    expect(text.status).toBe(415);
  });

  it("refuses a body that is too large", async () => {
    const huge = JSON.stringify({ padding: "x".repeat(20 * 1024) });
    expect((await post(huge)).status).toBe(413);
  });

  it("stores nothing for a refused round", async () => {
    await post(validSubmission({ shots: round.slice(0, -1) }));
    await post(validSubmission({ name: "pat" }));
    const { results } = await env.LEADERBOARD.prepare(
      "SELECT 1 FROM golf_scores",
    ).all();
    expect(results).toHaveLength(0);
  });
});

describe("GET /api/golf/scores", () => {
  const insert = (name: string, total: number, version = 1) =>
    env.LEADERBOARD.prepare(
      `INSERT INTO golf_scores
         (round_id, name, shots, strokes, total, course_version)
       VALUES (?1, ?2, '[]', '[1,1,1]', ?3, ?4)`,
    )
      .bind(crypto.randomUUID(), name, total, version)
      .run();

  it("is empty before anyone has played", async () => {
    expect(await list().then((r) => r.json())).toEqual({ scores: [] });
  });

  it("puts the best score first, and the earlier of equal scores first", async () => {
    await insert("AAA", 9);
    await insert("BBB", 7);
    await insert("CCC", 9);
    const { scores } = (await list().then((r) => r.json())) as {
      scores: { rank: number; name: string }[];
    };
    expect(scores.map((s) => [s.rank, s.name])).toEqual([
      [1, "BBB"],
      [2, "AAA"],
      [3, "CCC"],
    ]);
  });

  it("only shows the current course", async () => {
    await insert("OLD", 3, 0);
    await insert("NEW", 8);
    const { scores } = (await list().then((r) => r.json())) as {
      scores: { name: string }[];
    };
    expect(scores.map((s) => s.name)).toEqual(["NEW"]);
  });

  it("limits the list, defaulting to 10 and never more than 50", async () => {
    for (let i = 0; i < 12; i++) await insert("AAA", 10 + i);
    const count = async (query: string) =>
      ((await list(query).then((r) => r.json())) as { scores: unknown[] })
        .scores.length;
    expect(await count("")).toBe(10);
    expect(await count("?limit=3")).toBe(3);
    expect(await count("?limit=999")).toBe(12);
    expect(await count("?limit=0")).toBe(1);
    expect(await count("?limit=abc")).toBe(10);
  });

  it("lets browsers and Cloudflare cache it briefly", async () => {
    const response = await list();
    expect(response.headers.get("cache-control")).toBe("public, max-age=30");
  });
});

describe("the database", () => {
  it("rejects initials that aren't three capital letters", async () => {
    const insert = env.LEADERBOARD.prepare(
      `INSERT INTO golf_scores
         (round_id, name, shots, strokes, total, course_version)
       VALUES ('x', 'abc', '[]', '[]', 3, 1)`,
    );
    await expect(insert.run()).rejects.toThrow();
  });
});
