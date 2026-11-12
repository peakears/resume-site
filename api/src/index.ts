import { Hono } from "hono";
import { scores } from "./golf/scores";

/**
 * The API for patrickkearney.dev, served at /api/*. Each section of the site
 * mounts its own routes under its own prefix, e.g. /api/golf.
 */
const app = new Hono<{ Bindings: Env }>().basePath("/api");

/** Confirms the Worker is up and can reach its database. */
app.get("/health", async (c) => {
  await c.env.LEADERBOARD.prepare("SELECT 1").first();
  return c.json({ ok: true });
});

app.route("/golf", scores);

app.notFound((c) => c.json({ error: "Not found" }, 404));

app.onError((error, c) => {
  console.error(error);
  return c.json({ error: "Something went wrong" }, 500);
});

export default app;
