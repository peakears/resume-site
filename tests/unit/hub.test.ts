import { describe, expect, it } from "vitest";
import type { Profile } from "@/data/profile";
import {
  HUB_URL,
  escapeHtml,
  hubLinks,
  renderHubPage,
  renderNotFoundPage,
} from "@/lib/hub";

const profile = {
  name: "Jane <Doe>",
  title: "Software Engineer",
  location: "Toronto, Ontario, Canada",
  email: "jane@example.com",
  socials: [
    { label: "GitHub", href: "https://github.com/jane" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/jane/" },
  ],
  resumePdf: "/resume.pdf",
  siteUrl: "https://home.example.dev",
  headshot: { src: "/headshot.jpg", alt: "Jane Doe" },
} as Profile;

describe("escapeHtml", () => {
  it("escapes characters that could break out of HTML or attributes", () => {
    expect(escapeHtml(`<a href="x">Tom & Jerry's</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;",
    );
  });
});

describe("hubLinks", () => {
  it("links the resume first, then the PDF, socials and email", () => {
    expect(hubLinks(profile)).toEqual([
      {
        label: "Resume",
        detail: "Experience, skills and projects",
        href: "https://home.example.dev/",
        primary: true,
      },
      {
        label: "Download resume (PDF)",
        detail: "One page, ready to print",
        href: "https://home.example.dev/resume.pdf",
      },
      {
        label: "GitHub",
        detail: "github.com/jane",
        href: "https://github.com/jane",
      },
      {
        label: "LinkedIn",
        detail: "linkedin.com/in/jane",
        href: "https://www.linkedin.com/in/jane/",
      },
      {
        label: "Email",
        detail: "jane@example.com",
        href: "mailto:jane@example.com",
      },
    ]);
  });
});

describe("renderHubPage", () => {
  const html = renderHubPage(profile);

  it("escapes profile text", () => {
    expect(html).toContain("<h1>Jane &lt;Doe&gt;</h1>");
    expect(html).not.toContain("<Doe>");
  });

  it("declares the apex as canonical and reuses the resume's preview image", () => {
    expect(html).toContain(`<link rel="canonical" href="${HUB_URL}/">`);
    expect(html).toContain(
      '<meta property="og:image" content="https://home.example.dev/opengraph-image">',
    );
  });

  it("shows the headshot only when there is one", () => {
    expect(html).toContain(
      '<img class="avatar" src="/headshot.jpg" alt="Jane Doe"',
    );
    expect(renderHubPage({ ...profile, headshot: undefined })).not.toContain(
      "<img",
    );
  });
});

describe("renderNotFoundPage", () => {
  it("links back to the hub and stays out of search results", () => {
    const html = renderNotFoundPage(profile);
    expect(html).toContain('<meta name="robots" content="noindex">');
    expect(html).toContain('href="/"');
  });
});
