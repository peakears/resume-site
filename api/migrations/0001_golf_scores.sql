-- Mini-golf leaderboard: one row per posted round.
CREATE TABLE golf_scores (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  -- A UUID the browser makes when a round starts, so a retry can't post twice.
  round_id       TEXT    NOT NULL UNIQUE,
  -- Three-letter initials, A to Z.
  name           TEXT    NOT NULL CHECK (name GLOB '[A-Z][A-Z][A-Z]'),
  -- The putts as sent (JSON), so a score can be replayed and checked again.
  shots          TEXT    NOT NULL,
  -- Strokes per hole (JSON) and their sum, both worked out by the server.
  strokes        TEXT    NOT NULL,
  total          INTEGER NOT NULL CHECK (total >= 1),
  course_version INTEGER NOT NULL,
  created_at     TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- The leaderboard query: best total first. Ties are ordered by id, which is
-- the order rounds were posted in (every index also holds the row id).
CREATE INDEX golf_scores_rank ON golf_scores (course_version, total);
