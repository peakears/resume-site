import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Leaderboard } from "@/components/Leaderboard";

const entries = [
  { rank: 1, name: "ACE", total: 8, strokes: [2, 3, 3], createdAt: "a" },
  { rank: 2, name: "PAT", total: 10, strokes: [3, 3, 4], createdAt: "b" },
  { rank: 3, name: "ZED", total: 7, strokes: [1, 3, 3], createdAt: "c" },
];

describe("Leaderboard", () => {
  it("says it is loading while the scores are on their way", () => {
    render(<Leaderboard entries={undefined} par={8} />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading the leaderboard",
    );
  });

  it("says when it can't be reached", () => {
    render(<Leaderboard entries={null} par={8} />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Leaderboard unavailable.",
    );
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("invites the first score when it is empty", () => {
    render(<Leaderboard entries={[]} par={8} />);
    expect(screen.getByRole("status")).toHaveTextContent("Be the first");
  });

  it("lists each score with its rank, initials, strokes and to par", () => {
    render(<Leaderboard entries={entries} par={8} />);
    const table = screen.getByRole("table", { name: "Leaderboard" });
    const rows = within(table).getAllByRole("row");
    expect(rows).toHaveLength(entries.length + 1);
    const cells = (row: HTMLElement) =>
      within(row)
        .getAllByRole("cell")
        .map((cell) => cell.textContent);
    expect(cells(rows[1])).toEqual(["1", "ACE", "8", "E"]);
    expect(cells(rows[2])).toEqual(["2", "PAT", "10", "+2"]);
    expect(cells(rows[3])).toEqual(["3", "ZED", "7", "-1"]);
  });

  it("marks the visitor's own row in words, not only colour", () => {
    render(<Leaderboard entries={entries} par={8} highlightRank={2} />);
    const mine = screen.getByRole("row", { current: true });
    expect(mine).toHaveTextContent("PAT (you)");
    expect(screen.getAllByRole("row", { current: true })).toHaveLength(1);
  });

  it("marks nobody when there is no highlight", () => {
    render(<Leaderboard entries={entries} par={8} />);
    expect(screen.queryByRole("row", { current: true })).toBeNull();
    expect(screen.queryByText("(you)")).toBeNull();
  });
});
