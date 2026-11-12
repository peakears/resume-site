import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PostScoreForm } from "@/components/PostScoreForm";
import type { PostResult } from "@/lib/leaderboardApi";

const saved: PostResult = { status: "saved", id: 1, rank: 3, total: 9 };
const input = () => screen.getByRole("textbox", { name: "Your initials" });
const button = () => screen.getByRole("button", { name: "Post score" });

describe("PostScoreForm", () => {
  it("starts with the initials used last time", () => {
    render(<PostScoreForm defaultName="PAT" onPost={vi.fn()} />);
    expect(input()).toHaveValue("PAT");
    expect(button()).toBeEnabled();
  });

  it("keeps only capital letters, up to three", async () => {
    const user = userEvent.setup();
    render(<PostScoreForm onPost={vi.fn()} />);
    await user.type(input(), "pa7t!s");
    expect(input()).toHaveValue("PAT");
  });

  it("can't be posted until there are three letters", async () => {
    const user = userEvent.setup();
    render(<PostScoreForm onPost={vi.fn()} />);
    expect(button()).toBeDisabled();
    await user.type(input(), "PA");
    expect(button()).toBeDisabled();
    await user.type(input(), "T");
    expect(button()).toBeEnabled();
  });

  it("posts the initials and shows the rank", async () => {
    const user = userEvent.setup();
    const onPost = vi.fn().mockResolvedValue(saved);
    render(<PostScoreForm onPost={onPost} />);
    await user.type(input(), "pat");
    await user.click(button());
    expect(onPost).toHaveBeenCalledWith("PAT");
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Posted! You're number 3 on the leaderboard.",
    );
    expect(screen.queryByRole("button", { name: "Post score" })).toBeNull();
  });

  it("posts with Enter", async () => {
    const user = userEvent.setup();
    const onPost = vi.fn().mockResolvedValue(saved);
    render(<PostScoreForm defaultName="PAT" onPost={onPost} />);
    await user.type(input(), "{Enter}");
    expect(onPost).toHaveBeenCalledOnce();
  });

  it("won't post initials the leaderboard blocks", async () => {
    const user = userEvent.setup();
    const onPost = vi.fn();
    render(<PostScoreForm defaultName="ASS" onPost={onPost} />);
    await user.click(button());
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Pick different initials.",
    );
    expect(onPost).not.toHaveBeenCalled();
  });

  it("shows a refusal from the server and lets the visitor try again", async () => {
    const user = userEvent.setup();
    const onPost = vi
      .fn()
      .mockResolvedValueOnce({ status: "limited", message: "Slow down." })
      .mockResolvedValueOnce(saved);
    render(<PostScoreForm defaultName="PAT" onPost={onPost} />);
    await user.click(button());
    expect(await screen.findByRole("alert")).toHaveTextContent("Slow down.");
    await user.click(button());
    expect(await screen.findByRole("status")).toHaveTextContent("Posted!");
  });

  it("says the score wasn't posted when the leaderboard is unavailable", async () => {
    const user = userEvent.setup();
    const onPost = vi.fn().mockResolvedValue({ status: "unavailable" });
    render(<PostScoreForm defaultName="PAT" onPost={onPost} />);
    await user.click(button());
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Leaderboard unavailable. Your score wasn't posted.",
    );
    expect(button()).toBeEnabled();
  });

  it("disables the button while posting, so it can't be sent twice", async () => {
    const user = userEvent.setup();
    let finish: (result: PostResult) => void = () => {};
    const onPost = vi.fn(() => new Promise<PostResult>((r) => (finish = r)));
    render(<PostScoreForm defaultName="PAT" onPost={onPost} />);
    await user.click(button());
    expect(screen.getByRole("button", { name: "Posting…" })).toBeDisabled();
    finish(saved);
    expect(await screen.findByRole("status")).toBeInTheDocument();
    expect(onPost).toHaveBeenCalledOnce();
  });
});
