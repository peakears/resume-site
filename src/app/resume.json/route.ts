import { profile } from "@/data/profile";
import { buildJsonResume } from "@/lib/jsonResume";

// Required with `output: "export"`: write this file once at build time.
export const dynamic = "force-static";

export function GET() {
  return Response.json(buildJsonResume(profile));
}
