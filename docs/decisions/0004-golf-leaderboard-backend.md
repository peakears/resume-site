# 0004: Golf leaderboard backend

**Status:** Accepted, November 2026

## Context

The mini-golf game (`golf` in the terminal) is getting a leaderboard ([#22](https://github.com/peakears/resume-site/issues/22)), which needs somewhere to store scores and a way to stop people posting made-up ones. The site is a static export on Cloudflare Workers ([0001](0001-initial-stack.md)) under `/resume` ([0003](0003-sections-on-paths.md)), and there are no user accounts.

The game's physics is deterministic: a fixed 1/120 s step and pure functions in `src/lib/golf.ts`. So a server can replay a round from the putts alone and work out the score itself, instead of trusting a number from the browser.

## Decisions

- **A TypeScript Worker of its own, for the whole domain.** A third Worker (`api/`, with its own `wrangler.jsonc`) owns `patrickkearney.dev/api/*` and the database; the resume and hub Workers stay static. It belongs to no one section: each section mounts its routes under its own prefix (`/api/golf/...`, later `/api/photos/...`) with [Hono](https://hono.dev), and every page on the domain can call it with no CORS. This fits [0003](0003-sections-on-paths.md), which keeps separate systems such as an API apart from the sections. Putting the code inside the resume Worker was simpler, but would have made the resume own every future section's backend.
- **TypeScript end to end.** The Worker imports `src/lib/golf.ts` straight from the repo. Rust and Python Workers were considered for the sake of trying a new language, and rejected: either would mean writing the physics twice (or shipping it to the browser as WebAssembly), and a second copy that can drift is exactly what a replay can't tolerate.
- **Cloudflare D1 (SQLite) for storage.** Serverless like the rest of the site, and a leaderboard is one small table. The database (`golf-leaderboard`) holds the leaderboard and nothing else; if another section ever needs storage, it gets its own.
- **The browser sends putts, never a score.** A submission is the list of putts; the server runs `playRound()` from `golf.ts` and stores the score it gets. An impossible score can't be submitted, because no putts produce it. The issue suggested plausibility checks first (1 to 10 strokes a hole) and replay later; replay comes first instead, because it makes the plausibility checks unnecessary.
- **Two routes.** `POST /api/golf/scores` takes `{ roundId, name, shots, courseVersion }` and `GET /api/golf/scores?limit=10` returns the top scores. `roundId` is a UUID the browser makes when a round starts; it's unique in the database, so a retry can't post the same round twice. The timestamp is set by the server.
- **Rules and physics live in one module, used by both sides.** Stroke counting, the water penalty and the power limits moved out of `GolfGame.tsx` into `golf.ts` (`teeOff`, `strike`, `advance`, `playRound`). The component animates with the same functions the server replays with.
- **The replay must match the browser to the last bit, in every browser.** JavaScript engines agree exactly on `+ - * /` and `Math.sqrt`, but not on `Math.hypot`, `Math.sin` or `Math.cos`. So the physics uses only the exact operations, and a putt is recorded as its launch velocity (`Shot`), not an angle and power: the trigonometry runs once, in the browser, before the putt is recorded.
- **No accounts.** Players enter three-letter initials (A to Z), which leaves little room for abuse in a name. Posts are rate-limited per visitor with Cloudflare's rate-limit binding, and no IP addresses are stored. Cloudflare Turnstile is added only if spam appears.
- **Ties rank by earliest submission.**
- **A hole scores at most 10 strokes.** On the 10th stroke the ball is picked up and the hole counts 10, whether the putt stopped short or went in the water, and the game says so. Every round can therefore be finished and posted, and a round is at most 30 putts, which also keeps a crafted submission cheap to replay on the server.

## Consequences

- Anything added to the physics must stick to exact arithmetic. No trigonometry, `Math.hypot`, `Math.pow` or randomness inside `step()` and the functions it calls.
- A replay proves a round is possible, not that a person played it. With three fixed holes, someone can search for three holes-in-one and submit them, so the top of the board will fill with ties. That's acceptable for a toy; a changing course would be the fix.
- Changing a level or a physics constant changes what old putts score, so stored scores need a course version.
- The game and the API deploy separately. Right after a course or physics change, one can be ahead of the other for a moment; the course version turns that into a clear error instead of a wrong score.
- The game must keep working when the API can't be reached (`next dev`, the Playwright server, an outage): the game plays as normal and shows "Leaderboard unavailable".
- This is built in phases. The first only reshapes `golf.ts` and `GolfGame.tsx`; the Worker, database and leaderboard UI follow.
