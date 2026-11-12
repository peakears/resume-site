import type { LeaderboardEntry } from "@/lib/leaderboard";
import { toPar } from "@/lib/golf";

/**
 * The top scores. `entries` is undefined while loading and null when the
 * leaderboard can't be reached. `highlightRank` marks the visitor's own row.
 */
export function Leaderboard({
  entries,
  par,
  highlightRank,
}: {
  entries: LeaderboardEntry[] | null | undefined;
  par: number;
  highlightRank?: number;
}) {
  if (entries === undefined) {
    return (
      <p className="text-muted text-sm" role="status">
        Loading the leaderboard…
      </p>
    );
  }
  if (entries === null) {
    return (
      <p className="text-muted text-sm" role="status">
        Leaderboard unavailable.
      </p>
    );
  }
  if (entries.length === 0) {
    return (
      <p className="text-muted text-sm" role="status">
        No scores yet. Be the first!
      </p>
    );
  }

  return (
    <table className="text-center font-mono text-xs [&_td]:px-3 [&_td]:py-0.5 [&_th]:px-3">
      <caption className="sr-only">Leaderboard</caption>
      <thead>
        <tr className="text-muted">
          <th scope="col" className="font-normal">
            Rank
          </th>
          <th scope="col" className="text-left font-normal">
            Initials
          </th>
          <th scope="col" className="font-normal">
            Strokes
          </th>
          <th scope="col" className="font-normal">
            To par
          </th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => {
          const mine = entry.rank === highlightRank;
          return (
            <tr
              key={`${entry.rank}-${entry.createdAt}`}
              aria-current={mine ? "true" : undefined}
              className={mine ? "bg-surface font-semibold" : undefined}
            >
              <td>{entry.rank}</td>
              <td className="text-left">
                {entry.name}
                {mine && <span className="text-accent"> (you)</span>}
              </td>
              <td>{entry.total}</td>
              <td>{toPar(entry.total, par)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
