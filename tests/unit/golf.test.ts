import { describe, expect, it } from "vitest";
import {
  BALL_RADIUS,
  CAPTURE_SPEED,
  COURSE,
  FRICTION,
  LEVELS,
  MAX_SPEED,
  angleTo,
  inside,
  launch,
  scoreName,
  simulateShot,
  step,
  toPar,
  type Level,
} from "@/lib/golf";

const open: Level = {
  name: "Test",
  par: 2,
  start: { x: 100, y: 180 },
  hole: { x: 500, y: 180 },
  walls: [],
  sand: [],
  water: [],
};

describe("launch", () => {
  it("turns angle and power into a velocity", () => {
    const v = launch(0, 0.5);
    expect(v.x).toBeCloseTo(MAX_SPEED / 2);
    expect(v.y).toBeCloseTo(0);
  });

  it("caps power between 0 and 1", () => {
    expect(launch(0, 2).x).toBeCloseTo(MAX_SPEED);
    expect(launch(0, -1).x).toBeCloseTo(0);
  });
});

describe("step", () => {
  it("slows the ball down with friction until it stops", () => {
    const speed = 300;
    const shot = simulateShot(open, { x: 50, y: 300 }, 0, speed / MAX_SPEED);
    expect(shot.result).toBe("stopped");
    // Constant deceleration: distance = v² / 2a.
    expect(shot.pos.x - 50).toBeCloseTo((speed * speed) / (2 * FRICTION), -1);
  });

  it("drops a slow ball into the hole", () => {
    const { result } = step(open, {
      pos: { x: 495, y: 180 },
      vel: { x: CAPTURE_SPEED / 2, y: 0 },
    });
    expect(result).toBe("sunk");
  });

  it("lets a fast ball roll over the hole", () => {
    const { result } = step(open, {
      pos: { x: 495, y: 180 },
      vel: { x: CAPTURE_SPEED * 2, y: 0 },
    });
    expect(result).toBe("rolling");
  });

  it("bounces off walls", () => {
    const level = { ...open, walls: [{ x: 300, y: 0, w: 20, h: 360 }] };
    const { ball } = step(level, {
      pos: { x: 300 - BALL_RADIUS + 1, y: 100 },
      vel: { x: 200, y: 0 },
    });
    expect(ball.vel.x).toBeLessThan(0);
    expect(ball.pos.x).toBeLessThanOrEqual(300 - BALL_RADIUS);
  });

  it("bounces off the edge of the course", () => {
    const { ball } = step(open, {
      pos: { x: COURSE.width - BALL_RADIUS + 1, y: 100 },
      vel: { x: 200, y: 0 },
    });
    expect(ball.vel.x).toBeLessThan(0);
  });

  it("reports a ball that goes in the water", () => {
    const level = { ...open, water: [{ x: 200, y: 0, w: 50, h: 360 }] };
    expect(simulateShot(level, open.start, 0, 0.6).result).toBe("water");
  });

  it("slows the ball down faster in sand", () => {
    const sandy = { ...open, sand: [{ x: 0, y: 0, w: 600, h: 360 }] };
    const grass = simulateShot(open, { x: 50, y: 100 }, 0, 0.4);
    const sand = simulateShot(sandy, { x: 50, y: 100 }, 0, 0.4);
    expect(sand.pos.x).toBeLessThan(grass.pos.x);
  });
});

describe("the course", () => {
  it("can be holed in one on the first hole with the right putt", () => {
    const level = LEVELS[0];
    const aim = angleTo(level.start, level.hole);
    expect(simulateShot(level, level.start, aim, 0.65).result).toBe("sunk");
    expect(simulateShot(level, level.start, aim, 0.3).result).toBe("stopped");
  });

  it.each(LEVELS.map((level) => [level.name, level] as const))(
    "%s has its tee and hole on open green",
    (_, level) => {
      for (const point of [level.start, level.hole]) {
        expect(point.x).toBeGreaterThan(0);
        expect(point.x).toBeLessThan(COURSE.width);
        expect(point.y).toBeGreaterThan(0);
        expect(point.y).toBeLessThan(COURSE.height);
        for (const rect of [...level.walls, ...level.water, ...level.sand]) {
          expect(inside(rect, point)).toBe(false);
        }
      }
    },
  );

  it.each(LEVELS.map((level) => [level.name, level] as const))(
    "%s can be reached: some putt from the tee gets into the hole or close",
    (_, level) => {
      // Search the putts a player could make and keep the best finish.
      let best = Infinity;
      for (let degrees = 0; degrees < 360; degrees += 2) {
        for (let power = 0.1; power <= 1; power += 0.05) {
          const shot = simulateShot(
            level,
            level.start,
            (degrees * Math.PI) / 180,
            power,
          );
          if (shot.result === "sunk") return;
          if (shot.result === "stopped") {
            best = Math.min(
              best,
              Math.hypot(shot.pos.x - level.hole.x, shot.pos.y - level.hole.y),
            );
          }
        }
      }
      // No hole in one, but the first putt can leave a short second one.
      expect(best).toBeLessThan(120);
    },
  );
});

describe("scoring", () => {
  it.each([
    [1, 3, "Hole in one!"],
    [2, 4, "Eagle!"],
    [2, 3, "Birdie!"],
    [3, 3, "Par"],
    [4, 3, "Bogey"],
    [5, 3, "Double bogey"],
    [7, 3, "+4"],
  ])("%i strokes on a par %i is %s", (strokes, par, name) => {
    expect(scoreName(strokes, par)).toBe(name);
  });

  it("shows the total relative to par", () => {
    expect(toPar(8, 8)).toBe("E");
    expect(toPar(10, 8)).toBe("+2");
    expect(toPar(7, 8)).toBe("-1");
  });
});
