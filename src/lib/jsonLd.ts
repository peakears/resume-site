import type { Profile } from "@/data/profile";

/** Skill groups left out of `knowsAbout`: they aren't things I know yet. */
export const EXCLUDED_SKILL_GROUPS = new Set(["Currently Learning"]);

/**
 * Builds schema.org structured data describing the page as a profile of one
 * person, so search engines and AI tools don't have to infer it from layout.
 * https://schema.org/ProfilePage
 */
export function buildProfileJsonLd(profile: Profile) {
  const currentRoles = profile.experience.filter((role) => role.end === null);
  const knowsAbout = [
    ...new Set(
      profile.skills
        .filter((group) => !EXCLUDED_SKILL_GROUPS.has(group.category))
        .flatMap((group) => group.skills),
    ),
  ];

  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: `${profile.siteUrl}/`,
    mainEntity: {
      "@type": "Person",
      name: profile.name,
      jobTitle: profile.title,
      description: profile.summary,
      url: `${profile.siteUrl}/`,
      email: `mailto:${profile.email}`,
      homeLocation: { "@type": "Place", name: profile.location },
      worksFor: currentRoles.map((role) => ({
        "@type": "Organization",
        name: role.company,
      })),
      alumniOf: profile.education.map((entry) => ({
        "@type": "EducationalOrganization",
        name: entry.institution,
      })),
      knowsAbout,
      sameAs: profile.socials.map((social) => social.href),
    },
  };
}

/**
 * Serializes JSON-LD for an inline <script>. `<` is escaped so a value
 * containing "</script>" can't end the tag early (as the Next.js guide advises).
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
