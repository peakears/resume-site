import { describe, expect, it } from "vitest";
import {
  BALL_RADIUS,
  CAPTURE_SPEED,
  COURSE,
  FRICTION,
  LEVELS,
  MAX_SHOTS,
  MAX_SPEED,
  MAX_STROKES,
  MIN_POWER,
  advance,
  angleTo,
  inside,
  isLegalShot,
  launch,
  playRound,
  scoreName,
  simulateShot,
  step,
  strike,
  teeOff,
  toPar,
  type Level,
  type Shot,
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

describe("the rules", () => {
  const pond: Level = { ...open, water: [{ x: 200, y: 0, w: 50, h: 360 }] };

  it("starts a hole on the tee with no strokes", () => {
    expect(teeOff(open)).toEqual({
      ball: { pos: open.start, vel: { x: 0, y: 0 } },
      lie: open.start,
      strokes: 0,
    });
  });

  it("counts a stroke for each putt", () => {
    const hit = strike(teeOff(open), launch(0, 0.3));
    expect(hit.strokes).toBe(1);
    expect(hit.ball.vel.x).toBeCloseTo(0.3 * MAX_SPEED);
  });

  it("adds a penalty stroke in the water and returns the ball", () => {
    let state = strike(teeOff(pond), launch(0, 0.6));
    let result = "rolling";
    while (result === "rolling") ({ state, result } = advance(pond, state));
    expect(result).toBe("water");
    expect(state.strokes).toBe(2);
    expect(state.ball).toEqual({ pos: pond.start, vel: { x: 0, y: 0 } });
  });

  it("allows putts from minimum to full power only", () => {
    expect(isLegalShot(launch(1, MIN_POWER))).toBe(true);
    expect(isLegalShot(launch(1, 1))).toBe(true);
    expect(isLegalShot(launch(1, MIN_POWER / 2))).toBe(false);
    expect(isLegalShot({ x: MAX_SPEED, y: MAX_SPEED })).toBe(false);
    expect(isLegalShot({ x: NaN, y: 0 })).toBe(false);
    expect(isLegalShot({ x: Infinity, y: 0 })).toBe(false);
  });
});

describe("the stroke limit", () => {
  const pond: Level = { ...open, water: [{ x: 200, y: 0, w: 50, h: 360 }] };
  /** A putt that stops a couple of units from the tee. */
  const nudge = launch(Math.PI, MIN_POWER);

  /** Plays one putt to the end of its roll. */
  const roll = (level: Level, strokes: number, shot: Shot) => {
    let state = { ...strike(teeOff(level), shot), strokes: strokes + 1 };
    let result: string = "rolling";
    while (result === "rolling") ({ state, result } = advance(level, state));
    return { state, result };
  };

  it("lets the last allowed stroke hole out", () => {
    const { state, result } = roll(open, MAX_STROKES - 1, launch(0, 0.65));
    expect(result).toBe("sunk");
    expect(state.strokes).toBe(MAX_STROKES);
  });

  it("picks up a ball still in play after the last stroke", () => {
    const { state, result } = roll(open, MAX_STROKES - 1, nudge);
    expect(result).toBe("pickup");
    expect(state.strokes).toBe(MAX_STROKES);
  });

  it("keeps playing on until the last stroke", () => {
    expect(roll(open, MAX_STROKES - 2, nudge).result).toBe("stopped");
  });

  it("picks up after a splash on the last stroke, without going over", () => {
    const { state, result } = roll(pond, MAX_STROKES - 1, launch(0, 0.6));
    expect(result).toBe("pickup");
    expect(state.strokes).toBe(MAX_STROKES);
  });

  it("takes a splash on the second last stroke as the last", () => {
    const { state, result } = roll(pond, MAX_STROKES - 2, launch(0, 0.6));
    expect(result).toBe("pickup");
    expect(state.strokes).toBe(MAX_STROKES);
  });

  it("allows as many putts in a round as the limit on every hole", () => {
    expect(MAX_SHOTS).toBe(LEVELS.length * MAX_STROKES);
  });
});

describe("replaying a round", () => {
  // One hole, 400 units straight ahead: 65% power holes it, 30% stops short.
  const ace = launch(0, 0.65);
  const short = launch(0, 0.3);
  const tapIn = launch(0, 0.57);
  const nudge = launch(Math.PI, MIN_POWER);
  const course = [open, open];

  it("scores each hole from the putts alone", () => {
    expect(playRound([ace, ace], course)).toEqual([1, 1]);
    // A short first putt leaves 300 units, which a gentler second one holes.
    expect(playRound([short, tapIn, ace], course)).toEqual([2, 1]);
  });

  it("counts water penalties", () => {
    const pond: Level = { ...open, water: [{ x: 200, y: 0, w: 50, h: 20 }] };
    const splash: Shot = launch(angleTo(pond.start, { x: 225, y: 10 }), 0.6);
    // Putt, penalty, then a hole in one from the tee again.
    expect(playRound([splash, ace], [pond])).toEqual([3]);
  });

  it("gives the same score every time", () => {
    const shots = [short, tapIn, ace];
    expect(playRound(shots, course)).toEqual([2, 1]);
    expect(playRound(shots, course)).toEqual([2, 1]);
  });

  it("survives a trip through JSON, as the server will receive it", () => {
    // Awkward decimals, so the test would notice any lost digits.
    const shots = [launch(0.001234567, 0.6512345), launch(-0.0017, 0.6487)];
    const sent = JSON.parse(JSON.stringify(shots)) as Shot[];
    expect(sent).toEqual(shots);
    expect(playRound(sent, course)).toEqual([1, 1]);
  });

  it("scores a hole at the limit and moves on to the next", () => {
    const nudges = Array.from({ length: MAX_STROKES }, () => nudge);
    expect(playRound([...nudges, ace], course)).toEqual([MAX_STROKES, 1]);
  });

  it("scores the limit when the last stroke ends in the water", () => {
    const pond: Level = { ...open, water: [{ x: 200, y: 0, w: 50, h: 360 }] };
    const nudges = Array.from({ length: MAX_STROKES - 1 }, () => nudge);
    const splash = launch(0, 0.6);
    expect(playRound([...nudges, splash, ace], [pond, open])).toEqual([
      MAX_STROKES,
      1,
    ]);
  });

  it("rejects a round that isn't finished", () => {
    expect(playRound([], course)).toBeNull();
    expect(playRound([ace], course)).toBeNull();
    expect(playRound([short, short], course)).toBeNull();
  });

  it("rejects putts after the last hole", () => {
    expect(playRound([ace, ace, ace], course)).toBeNull();
  });

  it("rejects a putt the game wouldn't allow", () => {
    expect(playRound([{ x: MAX_SPEED * 2, y: 0 }, ace], course)).toBeNull();
    expect(playRound([{ x: 1, y: 0 }, tapIn, ace], course)).toBeNull();
  });

  it("rejects an absurdly long round", () => {
    const shots = Array.from({ length: MAX_SHOTS + 1 }, () => short);
    expect(playRound(shots, course)).toBeNull();
  });

  it("scores a real round on the real course", () => {
    // Find a holing putt for each hole from wherever the ball lies, the way
    // a player would, then check the replay agrees with the search.
    const shots: Shot[] = [];
    const expected: number[] = [];
    for (const level of LEVELS) {
      let state = teeOff(level);
      let sunk = false;
      while (!sunk) {
        let best: { shot: Shot; gap: number; sunk: boolean } | null = null;
        for (let degrees = 0; degrees < 360 && !best?.sunk; degrees += 2) {
          for (let power = 0.1; power <= 1; power += 0.05) {
            const from = state.ball.pos;
            const angle = (degrees * Math.PI) / 180;
            const shot = simulateShot(level, from, angle, power);
            if (shot.result === "water") continue;
            const gap = Math.hypot(
              shot.pos.x - level.hole.x,
              shot.pos.y - level.hole.y,
            );
            if (!best || gap < best.gap) {
              best = {
                shot: launch(angle, power),
                gap,
                sunk: shot.result === "sunk",
              };
            }
            if (best.sunk) break;
          }
        }
        shots.push(best!.shot);
        state = strike(state, best!.shot);
        let result = "rolling";
        while (result === "rolling") {
          ({ state, result } = advance(level, state));
        }
        sunk = result === "sunk";
        expect(state.strokes).toBeLessThan(10);
      }
      expected.push(state.strokes);
    }
    expect(playRound(shots)).toEqual(expected);
  });
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
