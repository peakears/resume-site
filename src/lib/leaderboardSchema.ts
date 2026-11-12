/**
 * The rules for accepting a posted round, as a Zod schema. Used by the API
 * Worker to check what arrives; the shared rules (names, course version)
 * live in leaderboard.ts so the game checks the same ones without Zod.
 */
import { z } from "zod";
import { MAX_SHOTS } from "./golf";
import { COURSE_VERSION, nameProblem, type Submission } from "./leaderboard";

export const nameSchema = z.string().superRefine((name, ctx) => {
  const problem = nameProblem(name);
  if (problem) ctx.addIssue({ code: "custom", message: problem });
});

/** A putt is its launch velocity; the server replays it with golf.ts. */
export const shotSchema = z.strictObject({
  x: z.number().finite(),
  y: z.number().finite(),
});

export const submissionSchema = z.strictObject({
  roundId: z.uuid(),
  name: nameSchema,
  shots: z.array(shotSchema).min(1).max(MAX_SHOTS),
  courseVersion: z.literal(COURSE_VERSION),
}) satisfies z.ZodType<Submission>;
