/**
 * Mini-golf physics and course data. Pure functions only, so the game can
 * be unit-tested without a canvas. Units are "course units": the course is
 * always 600 x 360 and the canvas scales it to fit.
 */

export interface Vec {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Level {
  name: string;
  par: number;
  start: Vec;
  hole: Vec;
  walls: Rect[];
  sand: Rect[];
  water: Rect[];
}

export interface Ball {
  pos: Vec;
  vel: Vec;
}

export type StepResult = "rolling" | "stopped" | "sunk" | "water";

export const COURSE = { width: 600, height: 360 } as const;
export const BALL_RADIUS = 6;
export const HOLE_RADIUS = 10;
/** Speed of a full-power putt, in units per second. */
export const MAX_SPEED = 700;
/** Deceleration on the green and in sand, in units per second squared. */
export const FRICTION = 220;
export const SAND_FRICTION = 900;
/** Faster than this, the ball rolls over the hole instead of dropping. */
export const CAPTURE_SPEED = 260;
export const STOP_SPEED = 4;
/** Share of speed kept after hitting a wall. */
export const RESTITUTION = 0.7;
/** Fixed physics step, so a putt plays the same at any frame rate. */
export const STEP = 1 / 120;

export const LEVELS: Level[] = [
  {
    name: "The Opener",
    par: 2,
    start: { x: 100, y: 180 },
    hole: { x: 500, y: 180 },
    walls: [],
    sand: [],
    water: [],
  },
  {
    name: "The Wall",
    par: 3,
    start: { x: 100, y: 90 },
    hole: { x: 500, y: 90 },
    walls: [{ x: 290, y: 0, w: 20, h: 250 }],
    sand: [{ x: 400, y: 230, w: 110, h: 70 }],
    water: [],
  },
  {
    name: "Water Carry",
    par: 3,
    start: { x: 90, y: 290 },
    hole: { x: 510, y: 80 },
    walls: [{ x: 380, y: 150, w: 20, h: 210 }],
    sand: [{ x: 450, y: 130, w: 120, h: 50 }],
    water: [{ x: 200, y: 150, w: 140, h: 210 }],
  },
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const length = (v: Vec) => Math.hypot(v.x, v.y);

export function inside(rect: Rect, point: Vec): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.w &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.h
  );
}

/** Angle (radians) from `from` to `to`. */
export function angleTo(from: Vec, to: Vec): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

/** Velocity for a putt at `angle` with `power` from 0 to 1. */
export function launch(angle: number, power: number): Vec {
  const speed = clamp(power, 0, 1) * MAX_SPEED;
  return { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };
}

/** Pushes the ball out of a wall and bounces it off. */
function collide(ball: Ball, rect: Rect): Ball {
  const nearest = {
    x: clamp(ball.pos.x, rect.x, rect.x + rect.w),
    y: clamp(ball.pos.y, rect.y, rect.y + rect.h),
  };
  const dx = ball.pos.x - nearest.x;
  const dy = ball.pos.y - nearest.y;
  const distance = Math.hypot(dx, dy);
  if (distance >= BALL_RADIUS) return ball;

  let normal: Vec;
  let pos: Vec;
  if (distance > 0) {
    normal = { x: dx / distance, y: dy / distance };
    pos = {
      x: nearest.x + normal.x * BALL_RADIUS,
      y: nearest.y + normal.y * BALL_RADIUS,
    };
  } else {
    // Centre is inside the wall: leave by the closest side.
    const exits = [
      { d: ball.pos.x - rect.x, n: { x: -1, y: 0 } },
      { d: rect.x + rect.w - ball.pos.x, n: { x: 1, y: 0 } },
      { d: ball.pos.y - rect.y, n: { x: 0, y: -1 } },
      { d: rect.y + rect.h - ball.pos.y, n: { x: 0, y: 1 } },
    ].sort((a, b) => a.d - b.d);
    normal = exits[0].n;
    pos = {
      x: ball.pos.x + normal.x * (exits[0].d + BALL_RADIUS),
      y: ball.pos.y + normal.y * (exits[0].d + BALL_RADIUS),
    };
  }

  const along = ball.vel.x * normal.x + ball.vel.y * normal.y;
  const vel =
    along < 0
      ? {
          x: ball.vel.x - (1 + RESTITUTION) * along * normal.x,
          y: ball.vel.y - (1 + RESTITUTION) * along * normal.y,
        }
      : ball.vel;
  return { pos, vel };
}

/** Course edges act like walls. */
const BOUNDARY: Rect[] = [
  { x: -100, y: -100, w: COURSE.width + 200, h: 100 },
  { x: -100, y: COURSE.height, w: COURSE.width + 200, h: 100 },
  { x: -100, y: -100, w: 100, h: COURSE.height + 200 },
  { x: COURSE.width, y: -100, w: 100, h: COURSE.height + 200 },
];

/** Advances the ball by one physics step. */
export function step(
  level: Level,
  ball: Ball,
  dt: number = STEP,
): { ball: Ball; result: StepResult } {
  let next: Ball = {
    pos: { x: ball.pos.x + ball.vel.x * dt, y: ball.pos.y + ball.vel.y * dt },
    vel: ball.vel,
  };
  for (const wall of [...level.walls, ...BOUNDARY]) {
    next = collide(next, wall);
  }

  const speed = length(next.vel);
  const toHole = Math.hypot(
    next.pos.x - level.hole.x,
    next.pos.y - level.hole.y,
  );
  if (toHole < HOLE_RADIUS && speed < CAPTURE_SPEED) {
    return {
      ball: { pos: { ...level.hole }, vel: { x: 0, y: 0 } },
      result: "sunk",
    };
  }

  if (level.water.some((pond) => inside(pond, next.pos))) {
    return { ball: { ...next, vel: { x: 0, y: 0 } }, result: "water" };
  }

  const inSand = level.sand.some((bunker) => inside(bunker, next.pos));
  const slowed = Math.max(0, speed - (inSand ? SAND_FRICTION : FRICTION) * dt);
  if (slowed < STOP_SPEED) {
    return { ball: { ...next, vel: { x: 0, y: 0 } }, result: "stopped" };
  }
  const scale = slowed / speed;
  return {
    ball: { ...next, vel: { x: next.vel.x * scale, y: next.vel.y * scale } },
    result: "rolling",
  };
}

/** Plays a whole putt to the end. Used by tests. */
export function simulateShot(
  level: Level,
  from: Vec,
  angle: number,
  power: number,
): { result: Exclude<StepResult, "rolling">; pos: Vec } {
  let ball: Ball = { pos: from, vel: launch(angle, power) };
  for (let i = 0; i < 60 / STEP; i++) {
    const next = step(level, ball);
    ball = next.ball;
    if (next.result !== "rolling")
      return { result: next.result, pos: ball.pos };
  }
  return { result: "stopped", pos: ball.pos };
}

/** Golf name for a score on one hole. */
export function scoreName(strokes: number, par: number): string {
  if (strokes === 1) return "Hole in one!";
  const names: Record<number, string> = {
    [-3]: "Albatross!",
    [-2]: "Eagle!",
    [-1]: "Birdie!",
    0: "Par",
    1: "Bogey",
    2: "Double bogey",
  };
  const diff = strokes - par;
  return names[diff] ?? `${diff > 0 ? "+" : ""}${diff}`;
}

/** "E" for even, otherwise "+2" / "-1", like a golf scoreboard. */
export function toPar(strokes: number, par: number): string {
  const diff = strokes - par;
  if (diff === 0) return "E";
  return diff > 0 ? `+${diff}` : String(diff);
}
