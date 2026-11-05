/**
 * All site content lives here. Components only render what this file
 * provides, so updating the resume never requires touching UI code.
 *
 * TODO: replace placeholder values (marked "TODO") with real details.
 */

export interface Link {
  label: string;
  href: string;
}

export interface Role {
  company: string;
  title: string;
  location: string;
  /** ISO year-month, e.g. "2022-01" */
  start: string;
  /** ISO year-month, or null for a current role */
  end: string | null;
  highlights: string[];
  tech: string[];
}

export interface SkillGroup {
  category: string;
  skills: string[];
}

export interface Project {
  name: string;
  description: string;
  tech: string[];
  links: Link[];
}

export interface Profile {
  name: string;
  title: string;
  location: string;
  availability: string;
  summary: string;
  about: string[];
  /** ISO year-month the career started; used to compute years of experience */
  careerStart: string;
  email: string;
  socials: Link[];
  experience: Role[];
  skills: SkillGroup[];
  projects: Project[];
}

export const profile: Profile = {
  name: "Your Name", // TODO
  title: "Software Engineer",
  location: "London, Ontario, Canada",
  availability: "Open to remote and hybrid roles",
  summary:
    "I build reliable, well-tested software and care about clean architecture, developer experience, and shipping things that matter.", // TODO
  about: [
    "TODO: A short paragraph about who you are as an engineer, what kinds of problems you enjoy, and what you're looking for next.",
    "TODO: A second paragraph about how you work: collaboration, testing, mentoring, or using AI tools like Claude effectively.",
  ],
  careerStart: "2022-01",
  email: "you@example.com", // TODO
  socials: [
    { label: "GitHub", href: "https://github.com/your-username" }, // TODO
    { label: "LinkedIn", href: "https://www.linkedin.com/in/your-profile" }, // TODO
  ],
  experience: [
    {
      company: "Current Company", // TODO
      title: "Software Engineer",
      location: "London, ON",
      start: "2024-01",
      end: null,
      highlights: [
        "TODO: Impact-focused highlight with a number, e.g. reduced page load time by 40%.",
        "TODO: Something you led or owned end to end.",
      ],
      tech: ["TypeScript", "React", "Node.js"],
    },
    {
      company: "Previous Company", // TODO
      title: "Junior Software Engineer",
      location: "London, ON",
      start: "2022-01",
      end: "2023-12",
      highlights: ["TODO: A highlight from this role."],
      tech: ["JavaScript", "SQL"],
    },
  ],
  skills: [
    { category: "Languages", skills: ["TypeScript", "JavaScript"] }, // TODO
    { category: "Frontend", skills: ["React", "Next.js", "Tailwind CSS"] },
    { category: "Backend", skills: ["Node.js"] },
    {
      category: "Testing",
      skills: ["Vitest", "React Testing Library", "Playwright"],
    },
    { category: "Tools", skills: ["Git", "GitHub", "Claude Code"] },
  ],
  projects: [
    {
      name: "This Website",
      description:
        "A statically exported Next.js resume site with typed content, unit tests, end-to-end tests, and automated accessibility checks.",
      tech: ["Next.js", "TypeScript", "Tailwind CSS", "Vitest", "Playwright"],
      links: [
        {
          label: "Source",
          href: "https://github.com/your-username/resume-site",
        },
      ], // TODO
    },
  ],
};
