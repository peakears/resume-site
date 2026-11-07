import { describe, expect, it } from "vitest";
import type { Profile, Role } from "@/data/profile";
import { buildProfileJsonLd, serializeJsonLd } from "@/lib/jsonLd";

const role = (company: string, end: string | null): Role => ({
  company,
  title: "Engineer",
  location: "Remote",
  start: "2020-01",
  end,
  highlights: [],
  tech: [],
});

const fixture: Profile = {
  name: "Jane Doe",
  title: "Software Engineer",
  location: "Toronto, Ontario, Canada",
  availability: "Open to work",
  summary: "Builds things.",
  aboutHeadline: "Headline.",
  about: [],
  coreStack: ["Java"],
  focus: ["tax"],
  careerStart: "2020-01",
  email: "jane@example.com",
  socials: [
    { label: "GitHub", href: "https://github.com/jane" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/jane/" },
  ],
  experience: [role("Current Co", null), role("Old Co", "2022-12")],
  skills: [
    { category: "Languages", skills: ["Java", "TypeScript"] },
    { category: "Observability", skills: ["CloudWatch", "Grafana"] },
    { category: "Cloud", skills: ["CloudWatch", "Lambda"] },
    { category: "Currently Learning", skills: ["Rust"] },
  ],
  projects: [],
  education: [
    {
      institution: "Example College",
      program: "CS",
      location: "Toronto",
      startYear: 2016,
      endYear: 2019,
      honours: [],
    },
  ],
  resumePdf: "/resume.pdf",
  siteUrl: "https://jane.example",
  hubUrl: "https://hub.jane.example",
};

describe("buildProfileJsonLd", () => {
  const jsonLd = buildProfileJsonLd(fixture);
  const person = jsonLd.mainEntity;

  it("describes a profile page about one person", () => {
    expect(jsonLd["@context"]).toBe("https://schema.org");
    expect(jsonLd["@type"]).toBe("ProfilePage");
    expect(jsonLd.url).toBe("https://jane.example/");
    expect(person).toMatchObject({
      "@type": "Person",
      name: "Jane Doe",
      jobTitle: "Software Engineer",
      description: "Builds things.",
      email: "mailto:jane@example.com",
      homeLocation: { "@type": "Place", name: "Toronto, Ontario, Canada" },
    });
  });

  it("lists only current employers in worksFor", () => {
    expect(person.worksFor).toEqual([
      { "@type": "Organization", name: "Current Co" },
    ]);
  });

  it("lists schools in alumniOf", () => {
    expect(person.alumniOf).toEqual([
      { "@type": "EducationalOrganization", name: "Example College" },
    ]);
  });

  it("links social profiles with sameAs", () => {
    expect(person.sameAs).toEqual([
      "https://github.com/jane",
      "https://www.linkedin.com/in/jane/",
    ]);
  });

  it("lists known skills once each, leaving out ones still being learned", () => {
    expect(person.knowsAbout).toEqual([
      "Java",
      "TypeScript",
      "CloudWatch",
      "Grafana",
      "Lambda",
    ]);
  });
});

describe("serializeJsonLd", () => {
  it("escapes < so a value can't close the script tag", () => {
    const output = serializeJsonLd({ name: "</script><script>alert(1)" });
    expect(output).not.toContain("<");
    expect(JSON.parse(output)).toEqual({ name: "</script><script>alert(1)" });
  });
});
