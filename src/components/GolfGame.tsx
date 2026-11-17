"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { Leaderboard } from "./Leaderboard";
import { PostScoreForm } from "./PostScoreForm";
import {
  BALL_RADIUS,
  COURSE,
  HOLE_RADIUS,
  LEVELS,
  MAX_STROKES,
  MIN_POWER,
  STEP,
  advance,
  angleTo,
  launch,
  scoreName,
  strike,
  teeOff,
  toPar,
  type HoleState,
  type Shot,
  type Vec,
} from "@/lib/golf";
import { COURSE_VERSION, type LeaderboardEntry } from "@/lib/leaderboard";
import { getScores, newRoundId, postScore } from "@/lib/leaderboardApi";

type Phase = "aiming" | "rolling" | "holed" | "finished";

/** How far (in course units) a drag must go for a full-power putt. */
const FULL_POWER_DRAG = 150;
const DEFAULT_POWER = 0.5;

const INITIALS_KEY = "golf-initials";

/** The initials used last time, if this browser lets us remember them. */
const savedInitials = () => {
  try {
    return localStorage.getItem(INITIALS_KEY) ?? "";
  } catch {
    return "";
  }
};

const rememberInitials = (name: string) => {
  try {
    localStorage.setItem(INITIALS_KEY, name);
  } catch {
    // Private browsing or blocked storage: the form just starts empty.
  }
};

const toDegrees = (radians: number) =>
  Math.round(((radians * 180) / Math.PI + 360) % 360);

/** A three-hole putting game in a modal dialog. */
export function GolfGame({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [levelIndex, setLevelIndex] = useState(0);
  const level = LEVELS[levelIndex];
  const [strokes, setStrokes] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>("aiming");
  const [angle, setAngle] = useState(() =>
    angleTo(LEVELS[0].start, LEVELS[0].hole),
  );
  const [power, setPower] = useState(DEFAULT_POWER);
  const [message, setMessage] = useState("");
  // The round's id, made when it starts, so posting twice can't count twice.
  const [roundId, setRoundId] = useState(newRoundId);
  // undefined while loading, null if the leaderboard can't be reached.
  const [board, setBoard] = useState<LeaderboardEntry[] | null | undefined>();
  const [postedRank, setPostedRank] = useState<number>();

  // The ball and the stroke count. The rules live in golf.ts, so the
  // leaderboard server can replay a round and reach the same score.
  const play = useRef<HoleState>(teeOff(level));
  // Every putt of the round, in order: what the server will replay.
  const shots = useRef<Shot[]>([]);
  const dragging = useRef(false);

  // Open as a modal so focus stays inside and Escape closes it.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }, []);

  const close = () => {
    const dialog = dialogRef.current;
    if (dialog && typeof dialog.close === "function" && dialog.open) {
      dialog.close(); // fires "close", which calls onClose
    } else {
      onClose();
    }
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const box = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(box.width * ratio);
    const height = Math.round(box.height * ratio);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const scale = width / COURSE.width;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    const styles = getComputedStyle(canvas);
    const color = (name: string) => styles.getPropertyValue(name).trim();

    ctx.fillStyle = color("--golf-green");
    ctx.fillRect(0, 0, COURSE.width, COURSE.height);

    // Mowing stripes, for a bit of texture.
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    for (let x = 0; x < COURSE.width; x += 60) ctx.fillRect(x, 0, 30, 360);

    ctx.fillStyle = color("--golf-sand");
    for (const r of level.sand) ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = color("--golf-water");
    for (const r of level.water) ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = color("--golf-wall");
    for (const r of level.walls) ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = color("--golf-wall");
    ctx.lineWidth = 8;
    ctx.strokeRect(0, 0, COURSE.width, COURSE.height);

    // Hole and flag.
    const { hole } = level;
    ctx.fillStyle = color("--golf-hole");
    ctx.beginPath();
    ctx.arc(hole.x, hole.y, HOLE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    if (phase !== "holed" && phase !== "finished") {
      ctx.strokeStyle = color("--golf-ball");
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hole.x, hole.y);
      ctx.lineTo(hole.x, hole.y - 44);
      ctx.stroke();
      ctx.fillStyle = color("--golf-flag");
      ctx.beginPath();
      ctx.moveTo(hole.x, hole.y - 44);
      ctx.lineTo(hole.x + 22, hole.y - 37);
      ctx.lineTo(hole.x, hole.y - 30);
      ctx.fill();
    }

    const { pos } = play.current.ball;

    // Aim guide: direction and power.
    if (phase === "aiming") {
      const reach = 24 + power * 120;
      ctx.strokeStyle = color("--golf-ball");
      ctx.globalAlpha = 0.8;
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(
        pos.x + Math.cos(angle) * reach,
        pos.y + Math.sin(angle) * reach,
      );
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    if (phase !== "holed" && phase !== "finished") {
      ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
      ctx.beginPath();
      ctx.arc(pos.x + 1.5, pos.y + 2, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color("--golf-ball");
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [angle, level, phase, power]);

  // Redraw on any change, and when the window (and canvas) resizes.
  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  // Run the physics while the ball rolls, at a fixed step per frame time.
  useEffect(() => {
    if (phase !== "rolling") return;
    let frame = 0;
    let last = performance.now();
    let pending = 0;

    const tick = (now: number) => {
      pending += Math.min(0.1, (now - last) / 1000);
      last = now;
      while (pending >= STEP) {
        pending -= STEP;
        const next = advance(level, play.current);
        play.current = next.state;
        if (next.result === "sunk") {
          const { strokes } = next.state;
          setScores((s) => [...s, strokes]);
          setMessage(
            `${scoreName(strokes, level.par)} ${strokes} ${strokes === 1 ? "stroke" : "strokes"} on a par ${level.par}.`,
          );
          setPhase("holed");
          return;
        }
        if (next.result === "pickup") {
          const { strokes } = next.state;
          setStrokes(strokes);
          setScores((s) => [...s, strokes]);
          setMessage(
            `Maximum score! ${MAX_STROKES} strokes is the most a hole can count, so the ball is picked up. On to the next hole.`,
          );
          setPhase("holed");
          return;
        }
        if (next.result === "water") {
          setStrokes(next.state.strokes);
          setMessage(
            "Splash! One-stroke penalty. Play again from your last spot.",
          );
          setPhase("aiming");
          return;
        }
        if (next.result === "stopped") {
          setPhase("aiming");
          return;
        }
      }
      draw();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [draw, level, phase]);

  // When the round ends, load the leaderboard to show beside the scorecard.
  useEffect(() => {
    if (phase !== "finished") return;
    const controller = new AbortController();
    getScores(10, { signal: controller.signal }).then((entries) => {
      if (!controller.signal.aborted) setBoard(entries);
    });
    return () => controller.abort();
  }, [phase]);

  const post = async (name: string) => {
    rememberInitials(name);
    const result = await postScore({
      roundId,
      name,
      shots: [...shots.current],
      courseVersion: COURSE_VERSION,
    });
    if (result.status === "saved") {
      setPostedRank(result.rank);
      // Skip the cached list, which was fetched before this score existed.
      getScores(10, { fresh: true }).then((entries) => {
        if (entries) setBoard(entries);
      });
    }
    return result;
  };

  const putt = () => {
    if (phase !== "aiming" || power < MIN_POWER) return;
    const shot = launch(angle, power);
    shots.current.push(shot);
    play.current = strike(play.current, shot);
    setStrokes(play.current.strokes);
    setMessage("");
    setPhase("rolling");
  };

  const goToHole = (index: number) => {
    const next = LEVELS[index];
    play.current = teeOff(next);
    setLevelIndex(index);
    setStrokes(0);
    setAngle(angleTo(next.start, next.hole));
    setPower(DEFAULT_POWER);
    setMessage("");
    setPhase("aiming");
  };

  const nextHole = () => {
    if (levelIndex + 1 < LEVELS.length) {
      goToHole(levelIndex + 1);
    } else {
      setPhase("finished");
      const total = scores.reduce((a, b) => a + b, 0);
      const par = LEVELS.reduce((a, l) => a + l.par, 0);
      setMessage(
        `Round complete: ${total} strokes on a par ${par} (${toPar(total, par)}).`,
      );
    }
  };

  const playAgain = () => {
    shots.current = [];
    setRoundId(newRoundId());
    setBoard(undefined);
    setPostedRank(undefined);
    setScores([]);
    goToHole(0);
  };

  // Pointer: press, drag back from the ball like a slingshot, release.
  const toCourse = (event: PointerEvent<HTMLCanvasElement>): Vec => {
    const box = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - box.left) / box.width) * COURSE.width,
      y: ((event.clientY - box.top) / box.height) * COURSE.height,
    };
  };

  const aimFrom = (point: Vec) => {
    const { pos } = play.current.ball;
    const pull = Math.hypot(point.x - pos.x, point.y - pos.y);
    setAngle(angleTo(point, pos));
    setPower(Math.min(1, pull / FULL_POWER_DRAG));
  };

  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (phase !== "aiming") return;
    dragging.current = true;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    aimFrom(toCourse(event));
  };

  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (dragging.current) aimFrom(toCourse(event));
  };

  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    putt();
  };

  // Keyboard: arrows aim and set power, Space or Enter putts.
  const onKeyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
    const turn = ((event.shiftKey ? 10 : 2) * Math.PI) / 180;
    const handlers: Record<string, () => void> = {
      ArrowLeft: () => setAngle((a) => a - turn),
      ArrowRight: () => setAngle((a) => a + turn),
      ArrowUp: () => setPower((p) => Math.min(1, +(p + 0.05).toFixed(2))),
      ArrowDown: () => setPower((p) => Math.max(0, +(p - 0.05).toFixed(2))),
      " ": putt,
      Enter: putt,
    };
    const handler = handlers[event.key];
    if (handler && phase === "aiming") {
      event.preventDefault();
      handler();
    }
  };

  const totalPar = LEVELS.reduce((a, l) => a + l.par, 0);
  const totalStrokes = scores.reduce((a, b) => a + b, 0);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="golf-title"
      onClose={onClose}
      className="bg-background text-foreground border-border m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-xl border p-4 shadow-2xl backdrop:bg-black/60 sm:p-6 print:hidden"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="golf-title" className="text-xl font-bold tracking-tight">
            Mini golf
          </h2>
          <p className="text-muted text-sm">
            Hole {levelIndex + 1} of {LEVELS.length}: {level.name} · Par{" "}
            {level.par} · Strokes {strokes}
          </p>
        </div>
        <button
          type="button"
          onClick={close}
          className="border-border hover:bg-surface rounded-md border px-3 py-1.5 text-sm font-medium"
        >
          Close
        </button>
      </div>

      <canvas
        ref={canvasRef}
        tabIndex={0}
        role="application"
        aria-label="Putting green"
        aria-describedby="golf-help"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (dragging.current = false)}
        onKeyDown={onKeyDown}
        className="focus-visible:outline-accent mt-4 aspect-[600/360] w-full touch-none rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2"
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
        <p id="golf-help" className="text-muted">
          Drag back from the ball and let go to putt. Or use the keyboard: ← →
          to aim, ↑ ↓ for power, Space to putt.
        </p>
        <p className="font-mono text-xs" aria-live="polite">
          Aim {toDegrees(angle)}° · Power {Math.round(power * 100)}%
        </p>
      </div>

      <div
        role="status"
        className="mt-3 flex min-h-10 flex-wrap items-center gap-3"
      >
        {message && <p className="font-semibold">{message}</p>}
        {phase === "holed" && (
          <button
            type="button"
            onClick={nextHole}
            className="bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium hover:opacity-90"
          >
            {levelIndex + 1 < LEVELS.length ? "Next hole" : "See scorecard"}
          </button>
        )}
        {phase === "finished" && (
          <button
            type="button"
            onClick={playAgain}
            className="bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium hover:opacity-90"
          >
            Play again
          </button>
        )}
      </div>

      {scores.length > 0 && (
        <table className="mt-4 text-center font-mono text-xs [&_td]:px-3 [&_th]:px-3 [&_th:first-child]:pl-0">
          <caption className="sr-only">Scorecard</caption>
          <thead>
            <tr className="text-muted">
              <th scope="col" className="text-left font-normal">
                Hole
              </th>
              {LEVELS.map((_, i) => (
                <th key={i} scope="col" className="font-normal">
                  {i + 1}
                </th>
              ))}
              <th scope="col" className="font-normal">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" className="text-muted text-left font-normal">
                Par
              </th>
              {LEVELS.map((l, i) => (
                <td key={i}>{l.par}</td>
              ))}
              <td>{totalPar}</td>
            </tr>
            <tr className="font-semibold">
              <th scope="row" className="text-left">
                You
              </th>
              {LEVELS.map((_, i) => (
                <td key={i}>{scores[i] ?? "–"}</td>
              ))}
              <td>{totalStrokes}</td>
            </tr>
          </tbody>
        </table>
      )}

      {phase === "finished" && (
        <section aria-labelledby="golf-board-title" className="mt-6">
          <h3 id="golf-board-title" className="mb-3 text-sm font-semibold">
            Leaderboard
          </h3>
          <PostScoreForm
            key={roundId}
            defaultName={savedInitials()}
            onPost={post}
          />
          <div className="mt-4">
            <Leaderboard
              entries={board}
              par={totalPar}
              highlightRank={postedRank}
            />
          </div>
        </section>
      )}
    </dialog>
  );
}
