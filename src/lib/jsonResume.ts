import type { Profile } from "@/data/profile";
import { EXCLUDED_SKILL_GROUPS } from "./jsonLd";

/** The JSON Resume schema version this file follows. */
const SCHEMA =
  "https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json";

/**
 * Builds the resume in the JSON Resume format (https://jsonresume.org), so
 * tools and themes that read that format can use it. Served at /resume.json.
 */
export function buildJsonResume(profile: Profile) {
  const [city, region] = profile.location.split(", ");
  return {
    $schema: SCHEMA,
    basics: {
      name: profile.name,
      label: profile.title,
      ...(profile.headshot && {
        image: new URL(
          profile.headshot.src.replace(/^\//, ""),
          `${profile.siteUrl}/`,
        ).href,
      }),
      email: profile.email,
      url: `${profile.siteUrl}/`,
      summary: profile.summary,
      location: { city, region },
      profiles: profile.socials.map((social) => ({
        network: social.label,
        url: social.href,
      })),
    },
    work: profile.experience.map((role) => ({
      name: role.company,
      position: role.title,
      location: role.location,
      startDate: role.start,
      ...(role.end && { endDate: role.end }),
      highlights: role.highlights,
    })),
    education: profile.education.map((entry) => ({
      institution: entry.institution,
      area: entry.program,
      startDate: String(entry.startYear),
      endDate: String(entry.endYear),
    })),
    skills: profile.skills
      .filter((group) => !EXCLUDED_SKILL_GROUPS.has(group.category))
      .map((group) => ({ name: group.category, keywords: group.skills })),
    projects: profile.projects.map((project) => ({
      name: project.name,
      description: project.description,
      keywords: project.tech,
      ...(project.links[0] && { url: project.links[0].href }),
    })),
  };
}
