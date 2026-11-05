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
    "Software engineer specializing in payments and e-commerce systems. I modernize legacy services, build cloud-native APIs on AWS, and ship well-tested code in Java and TypeScript.",
  about: [
    "I've spent my career on payments and commerce teams at CARFAX, where reliability matters: when checkout breaks, revenue stops. My work has ranged from upgrading long-lived Java services and replacing legacy payment SDKs with modern APIs, to designing new tax and commerce services from the ground up.",
    "I care about leaving systems better than I found them: safer secret handling, smaller and simpler services, and tests that make change cheap. I use AI tools like Claude day to day to move faster on boilerplate and test coverage, so more of my time goes into design and review. This site's repo is an example of that workflow.",
  ],
  careerStart: "2022-01",
  email: "you@example.com", // TODO
  socials: [
    { label: "GitHub", href: "https://github.com/your-username" }, // TODO
    { label: "LinkedIn", href: "https://www.linkedin.com/in/your-profile" }, // TODO
  ],
  experience: [
    {
      company: "CARFAX",
      title: "Software Engineer",
      location: "London, ON",
      start: "2025-03",
      end: null,
      highlights: [
        "Helped plan, design and build a new payments and tax platform on the open-source MedusaJS commerce framework, using its built-in data model to speed up delivery.",
        "Designed a Java 17 Tax API that lets internal teams quote and record sales tax through one shared service.",
      ],
      tech: ["Java 17", "TypeScript", "MedusaJS", "Node.js"],
    },
    {
      company: "CARFAX",
      title: "Associate Software Engineer",
      location: "London, ON",
      start: "2022-01",
      end: "2025-03",
      highlights: [
        "Maintained integrations with multiple payment providers for the consumer purchase flow.",
        "Upgraded payment services from Java 8 to Java 17 and replaced a 20-year-old payment-gateway SDK with direct, API-driven integrations.",
        "Rewrote a legacy Java 8 application as a TypeScript AWS Lambda and cut traffic over at the API gateway with zero downtime. Added automatic 30-day rotation of its encryption key.",
        "Built a Google Pay proof of concept on the checkout page and ran an A/B test to measure its value. The data showed it wasn't worth the added complexity, so we chose not to roll it out.",
      ],
      tech: ["Java", "TypeScript", "AWS Lambda", "AWS Secrets Manager"],
    },
  ],
  skills: [
    {
      category: "Languages",
      skills: ["Java", "TypeScript", "JavaScript", "SQL", "C++"],
    },
    {
      category: "Frameworks & Runtimes",
      skills: ["Node.js", "React", "Next.js", "MedusaJS"],
    },
    {
      category: "Cloud (AWS)",
      skills: [
        "Lambda",
        "SQS",
        "S3",
        "EventBridge",
        "Secrets Manager",
        "EC2",
        "SES",
      ],
    },
    {
      category: "Databases",
      skills: ["PostgreSQL", "MySQL", "DynamoDB", "MongoDB"],
    },
    {
      category: "Testing",
      skills: [
        "Jest",
        "JUnit",
        "Vitest",
        "React Testing Library",
        "Playwright",
      ],
    },
    {
      category: "Tools & Practices",
      skills: ["Git", "GitHub", "REST APIs", "A/B testing", "Claude Code"],
    },
    { category: "Currently Learning", skills: ["Python", "Go", "Rust"] },
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
