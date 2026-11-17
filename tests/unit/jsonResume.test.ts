import { describe, expect, it } from "vitest";
import { profile } from "@/data/profile";
import { buildJsonResume } from "@/lib/jsonResume";

describe("buildJsonResume", () => {
  const resume = buildJsonResume(profile);

  it("describes the person", () => {
    expect(resume.$schema).toMatch(/jsonresume\/resume-schema/);
    expect(resume.basics).toMatchObject({
      name: profile.name,
      label: profile.title,
      email: profile.email,
      url: `${profile.siteUrl}/`,
      location: { city: "London", region: "Ontario" },
    });
    expect(resume.basics.image).toBe(`${profile.siteUrl}/headshot.jpg`);
    expect(resume.basics.profiles.map((p) => p.url)).toEqual(
      profile.socials.map((s) => s.href),
    );
  });

  it("includes every role, without an end date for the current one", () => {
    expect(resume.work).toHaveLength(profile.experience.length);
    const current = resume.work.find((w) => !("endDate" in w));
    expect(current?.name).toBe(
      profile.experience.find((r) => r.end === null)?.company,
    );
    for (const work of resume.work) {
      expect(work.startDate).toMatch(/^\d{4}-\d{2}$/);
    }
  });

  it("leaves out skills still being learned", () => {
    const names = resume.skills.map((s) => s.name);
    expect(names).toContain("Languages");
    expect(names).not.toContain("Currently Learning");
  });
});
