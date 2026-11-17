"use client";

import { useId, useState, type FormEvent } from "react";
import { nameProblem } from "@/lib/leaderboard";
import type { PostResult } from "@/lib/leaderboardApi";

type Status =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "saved"; rank: number }
  | { state: "failed"; message: string };

/** Asks for three initials and posts the round with them. */
export function PostScoreForm({
  defaultName = "",
  onPost,
}: {
  defaultName?: string;
  onPost: (name: string) => Promise<PostResult>;
}) {
  const id = useId();
  const [name, setName] = useState(defaultName);
  const [status, setStatus] = useState<Status>({ state: "idle" });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const problem = nameProblem(name);
    if (problem) {
      setStatus({ state: "failed", message: problem });
      return;
    }
    setStatus({ state: "sending" });
    const result = await onPost(name);
    if (result.status === "saved") {
      setStatus({ state: "saved", rank: result.rank });
    } else if (result.status === "unavailable") {
      setStatus({
        state: "failed",
        message: "Leaderboard unavailable. Your score wasn't posted.",
      });
    } else {
      setStatus({ state: "failed", message: result.message });
    }
  };

  if (status.state === "saved") {
    return (
      <p role="status" className="text-sm font-semibold">
        Posted! You&apos;re number {status.rank} on the leaderboard.
      </p>
    );
  }

  const sending = status.state === "sending";
  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor={id} className="text-muted block text-xs">
          Your initials
        </label>
        <input
          id={id}
          value={name}
          onChange={(event) =>
            setName(event.target.value.toUpperCase().replace(/[^A-Z]/g, ""))
          }
          maxLength={3}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-describedby={`${id}-hint`}
          className="border-border bg-background focus-visible:outline-accent w-20 rounded-md border px-3 py-2 font-mono tracking-widest focus-visible:outline-2 focus-visible:outline-offset-2"
        />
      </div>
      <button
        type="submit"
        disabled={sending || name.length !== 3}
        className="bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
      >
        {sending ? "Posting…" : "Post score"}
      </button>
      <p id={`${id}-hint`} className="text-muted basis-full text-xs">
        Three letters, A to Z.
      </p>
      {status.state === "failed" && (
        <p role="alert" className="basis-full text-sm font-semibold">
          {status.message}
        </p>
      )}
    </form>
  );
}
