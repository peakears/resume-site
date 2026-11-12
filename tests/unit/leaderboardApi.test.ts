import { afterEach, describe, expect, it, vi } from "vitest";
import { COURSE_VERSION, type Submission } from "@/lib/leaderboard";
import {
  SCORES_URL,
  getScores,
  newRoundId,
  postScore,
} from "@/lib/leaderboardApi";

const submission: Submission = {
  roundId: "6f1c2b0e-8a43-4c1d-9d52-3b7d1f0a9e11",
  name: "PAT",
  shots: [{ x: 455, y: 0 }],
  courseVersion: COURSE_VERSION,
};

const reply = (status: number, body: unknown) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status }));

afterEach(() => vi.unstubAllGlobals());

describe("postScore", () => {
  it("posts the round as JSON", async () => {
    const fetchMock = reply(201, { id: 7, rank: 2, total: 9 });
    vi.stubGlobal("fetch", fetchMock);
    await postScore(submission);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe(SCORES_URL);
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("content-type")).toBe(
      "application/json",
    );
    expect(JSON.parse(init.body as string)).toEqual(submission);
  });

  it("reports a saved score with its rank", async () => {
    vi.stubGlobal("fetch", reply(201, { id: 7, rank: 2, total: 9 }));
    expect(await postScore(submission)).toEqual({
      status: "saved",
      id: 7,
      rank: 2,
      total: 9,
    });
  });

  it.each([400, 409])(
    "passes on the server's reason for a %i",
    async (code) => {
      vi.stubGlobal("fetch", reply(code, { error: "That round was refused." }));
      expect(await postScore(submission)).toEqual({
        status: "rejected",
        message: "That round was refused.",
      });
    },
  );

  it("says when the visitor is being limited", async () => {
    vi.stubGlobal("fetch", reply(429, { error: "Slow down." }));
    expect(await postScore(submission)).toEqual({
      status: "limited",
      message: "Slow down.",
    });
  });

  it("falls back to its own wording if the server gives no reason", async () => {
    vi.stubGlobal("fetch", reply(400, {}));
    expect(await postScore(submission)).toEqual({
      status: "rejected",
      message: "That score couldn't be saved.",
    });
  });

  it.each([404, 500, 503])("treats a %i as unavailable", async (code) => {
    vi.stubGlobal("fetch", reply(code, { error: "x" }));
    expect(await postScore(submission)).toEqual({ status: "unavailable" });
  });

  it("treats a page that isn't JSON as unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () => new Response("<html>Not found</html>", { status: 404 }),
      ),
    );
    expect(await postScore(submission)).toEqual({ status: "unavailable" });
  });

  it("treats a network failure as unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    expect(await postScore(submission)).toEqual({ status: "unavailable" });
  });

  it("doesn't trust a 201 without a rank", async () => {
    vi.stubGlobal("fetch", reply(201, { ok: true }));
    expect(await postScore(submission)).toEqual({ status: "unavailable" });
  });
});

describe("getScores", () => {
  const entry = {
    rank: 1,
    name: "PAT",
    total: 8,
    strokes: [2, 3, 3],
    createdAt: "2026-11-12T00:00:00.000Z",
  };

  it("returns the scores", async () => {
    const fetchMock = reply(200, { scores: [entry] });
    vi.stubGlobal("fetch", fetchMock);
    expect(await getScores(5)).toEqual([entry]);
    expect((fetchMock.mock.calls[0] as unknown[])[0]).toBe(
      `${SCORES_URL}?limit=5`,
    );
  });

  it("can skip the browser cache", async () => {
    const fetchMock = reply(200, { scores: [] });
    vi.stubGlobal("fetch", fetchMock);
    await getScores(10, { fresh: true });
    const init = (fetchMock.mock.calls[0] as unknown[])[1] as RequestInit;
    expect(init.cache).toBe("reload");
  });

  it.each([404, 500])("returns null for a %i", async (code) => {
    vi.stubGlobal("fetch", reply(code, {}));
    expect(await getScores()).toBeNull();
  });

  it("returns null when the reply isn't a list of scores", async () => {
    vi.stubGlobal("fetch", reply(200, { nope: true }));
    expect(await getScores()).toBeNull();
  });

  it("returns null when the network fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    expect(await getScores()).toBeNull();
  });
});

describe("newRoundId", () => {
  const uuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

  it("makes a UUID that the server will accept", () => {
    expect(newRoundId()).toMatch(uuid);
    expect(newRoundId()).not.toBe(newRoundId());
  });

  it("still makes one where crypto.randomUUID is missing", () => {
    vi.stubGlobal("crypto", {
      getRandomValues: crypto.getRandomValues.bind(crypto),
    });
    expect(newRoundId()).toMatch(uuid);
  });
});
