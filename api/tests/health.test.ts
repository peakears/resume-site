import { describe, expect, it } from "vitest";
import app from "../src/index";

/** A stand-in for D1 that answers, or fails, every query. */
const database = (works: boolean) =>
  ({
    prepare: () => ({
      first: async () => {
        if (!works) throw new Error("no database");
        return { 1: 1 };
      },
    }),
  }) as unknown as D1Database;

const get = (path: string, works = true) =>
  app.request(path, {}, { DB: database(works) } as Env);

describe("the API", () => {
  it("reports that it is up when the database answers", async () => {
    const response = await get("/api/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("answers with a JSON error when the database is down", async () => {
    const response = await get("/api/health", false);
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Something went wrong" });
  });

  it("answers unknown paths with a JSON 404", async () => {
    const response = await get("/api/nope");
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Not found" });
  });
});
