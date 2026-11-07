import type { Profile } from "@/data/profile";

/**
 * Builds the hub page served at the apex domain (patrickkearney.dev): a
 * small, framework-free page that links to the resume site and profiles.
 * Content comes from `profile.ts`, so the hub and the resume never disagree.
 *
 * Type-only imports keep this file runnable by plain Node (scripts/build-hub.mts).
 */

export interface HubLink {
  label: string;
  /** Short line under the label */
  detail: string;
  href: string;
  primary?: boolean;
}

/** Escapes text for safe use in HTML content and attribute values. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** "https://www.linkedin.com/in/x/" -> "linkedin.com/in/x" */
const displayUrl = (url: string) => {
  const { host, pathname } = new URL(url);
  return host.replace(/^www\./, "") + pathname.replace(/\/$/, "");
};

export function hubLinks(profile: Profile): HubLink[] {
  return [
    {
      label: "Resume",
      detail: "Experience, skills and projects",
      href: `${profile.siteUrl}/`,
      primary: true,
    },
    ...profile.socials.map((social) => ({
      label: social.label,
      detail: displayUrl(social.href),
      href: social.href,
    })),
    {
      label: "Email",
      detail: profile.email,
      href: `mailto:${profile.email}`,
    },
  ];
}

const linkItem = (link: HubLink) => `
        <li>
          <a class="link${link.primary ? " primary" : ""}" href="${escapeHtml(link.href)}">
            <span class="label">${escapeHtml(link.label)}</span>
            <span class="detail">${escapeHtml(link.detail)}</span>
          </a>
        </li>`;

/** The full HTML for the hub's index page. */
export function renderHubPage(profile: Profile): string {
  const title = `${profile.name} · ${profile.title}`;
  const description = `${profile.title} in ${profile.location}. Resume, GitHub, LinkedIn and contact links.`;
  const avatar = profile.headshot
    ? `<img class="avatar" src="/headshot.jpg" alt="${escapeHtml(profile.headshot.alt)}" width="112" height="112">`
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="canonical" href="${escapeHtml(profile.hubUrl)}/">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <meta name="color-scheme" content="light dark">
    <meta property="og:type" content="profile">
    <meta property="og:url" content="${escapeHtml(profile.hubUrl)}/">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:image" content="${escapeHtml(profile.siteUrl)}/opengraph-image">
    <meta name="twitter:card" content="summary_large_image">
    <link rel="stylesheet" href="/styles.css">
  </head>
  <body>
    <main>
      ${avatar}
      <h1>${escapeHtml(profile.name)}</h1>
      <p class="tagline">${escapeHtml(profile.title)} · ${escapeHtml(profile.location)}</p>
      <nav aria-label="Links">
        <ul>${hubLinks(profile).map(linkItem).join("")}
        </ul>
      </nav>
    </main>
    <footer>© ${new Date().getFullYear()} ${escapeHtml(profile.name)}</footer>
  </body>
</html>
`;
}

/** A small 404 page that points back to the hub. */
export function renderNotFoundPage(profile: Profile): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Page not found · ${escapeHtml(profile.name)}</title>
    <meta name="robots" content="noindex">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <meta name="color-scheme" content="light dark">
    <link rel="stylesheet" href="/styles.css">
  </head>
  <body>
    <main>
      <h1>Page not found</h1>
      <p class="tagline">That page doesn't exist.</p>
      <nav aria-label="Links">
        <ul>
          <li><a class="link primary" href="/"><span class="label">Back to ${escapeHtml(profile.name)}</span></a></li>
        </ul>
      </nav>
    </main>
  </body>
</html>
`;
}
