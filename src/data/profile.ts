/**
 * All site content lives here. Components only render what this file
 * provides, so updating the resume never requires touching UI code.
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
  /** Shown before "Show all skills" on the site. Every group is printed. */
  featured?: boolean;
}

export interface Project {
  name: string;
  description: string;
  tech: string[];
  links: Link[];
}

export interface Education {
  institution: string;
  program: string;
  location: string;
  startYear: number;
  endYear: number;
  honours: string[];
}

export interface Profile {
  name: string;
  title: string;
  location: string;
  availability: string;
  summary: string;
  /** One-sentence headline shown at the top of the About section */
  aboutHeadline: string;
  about: string[];
  /** Photo in `public/`, shown in the hero. Initials are shown without one. */
  headshot?: { src: string; alt: string };
  /** Main technologies, shown in the hero's terminal card */
  coreStack: string[];
  /** Areas of focus, shown in the hero's terminal card */
  focus: string[];
  /** ISO year-month the career started; used to compute years of experience */
  careerStart: string;
  email: string;
  socials: Link[];
  experience: Role[];
  skills: SkillGroup[];
  projects: Project[];
  education: Education[];
  /** Path to the downloadable PDF resume, served from `public/` */
  resumePdf: string;
  /** Public URL of the live site, used for SEO and link previews */
  siteUrl: string;
}

export const profile: Profile = {
  name: "Patrick Kearney",
  title: "Software Engineer",
  location: "London, Ontario, Canada",
  availability: "Open to remote and hybrid roles",
  summary:
    "Backend-focused software engineer building transactional services, third-party integrations and workflow-driven APIs on AWS. I design for reliability and security, and ship well-tested code in Java and TypeScript.",
  aboutHeadline:
    "Software engineer building backend platforms and integrations at CARFAX and Mobility Global since 2022.",
  about: [
    "I work across Java and TypeScript services on AWS, focusing on payment-provider integrations, tax, and modernizing legacy platforms. Recent work includes designing a shared Tax API for internal teams, building a commerce platform on MedusaJS, and migrating long-running Java services to Java 17 and serverless TypeScript.",
    "I prioritize reliability, secure handling of sensitive data, and strong automated test coverage. I use AI-assisted development tools to deliver efficiently without compromising quality.",
  ],
  headshot: { src: "/headshot.jpg", alt: "Patrick Kearney" },
  coreStack: ["Java", "Spring Boot", "TypeScript", "AWS"],
  focus: [
    "Payment Platforms",
    "API Design",
    "Legacy Modernization",
    "AI-Assisted Development",
  ],
  careerStart: "2022-01",
  email: "patrick.kearney27@gmail.com",
  socials: [
    { label: "GitHub", href: "https://github.com/peakears" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/pkearney4/" },
  ],
  experience: [
    {
      company: "Mobility Global",
      title: "Software Engineer",
      location: "London, ON",
      start: "2026-10",
      end: null,
      highlights: [
        "Software engineer on the Internal Apps – Finance team in the Digital Services Group.",
        "Joined when CARFAX moved its development teams to its parent company, Mobility Global.",
        "Use Claude Code as an agentic AI coding tool to ship faster and raise code quality.",
      ],
      tech: [],
    },
    {
      company: "CARFAX",
      title: "Software Engineer",
      location: "London, ON",
      start: "2025-03",
      end: "2026-09",
      highlights: [
        "Helped plan, design and build a new payments and tax platform on the open-source MedusaJS commerce framework, using its built-in data model to speed up delivery.",
        "Built and maintained services covering cart creation and the full payment lifecycle (authorize, capture, refund) across multiple payment providers, using synchronous and asynchronous workflows.",
        "Implemented per-team payment-provider configuration, managing multiple credentials per processor with AWS Systems Manager Parameter Store.",
        "Persisted customer, cart, order, product, payment, address and custom data in PostgreSQL.",
        "Designed a Java 17 Tax API that lets internal teams quote and record sales tax through one shared service.",
      ],
      tech: [
        "Java 17",
        "TypeScript",
        "MedusaJS",
        "PostgreSQL",
        "AWS SSM",
        "Vertex",
      ],
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
      featured: true,
      skills: ["Java", "TypeScript", "JavaScript", "SQL", "C++"],
    },
    {
      category: "Backend & APIs",
      featured: true,
      skills: [
        "Spring Boot",
        "Node.js",
        "Express",
        "MedusaJS",
        "REST",
        "OpenAPI / Swagger",
        "Zod",
        "Jackson",
        "Lombok",
      ],
    },
    {
      category: "Frontend",
      skills: ["React", "Next.js", "Tailwind CSS"],
    },
    {
      category: "Cloud (AWS)",
      featured: true,
      skills: [
        "Lambda",
        "API Gateway",
        "ECS / Fargate",
        "RDS / Aurora",
        "SQS",
        "S3",
        "EventBridge",
        "SES",
        "EC2",
        "IAM",
        "KMS",
        "Systems Manager (SSM)",
        "Secrets Manager",
        "CloudWatch",
      ],
    },
    {
      category: "Infrastructure & CI/CD",
      featured: true,
      skills: [
        "AWS CDK",
        "Terraform",
        "Serverless Framework",
        "Docker",
        "Docker Compose",
        "Gloo Gateway",
        "GitLab CI",
        "Jenkins",
      ],
    },
    {
      category: "Databases",
      featured: true,
      skills: ["PostgreSQL", "MySQL", "Redis", "DynamoDB", "MongoDB"],
    },
    {
      category: "Payments & Commerce",
      featured: true,
      skills: [
        "PayPal",
        "Amazon Pay",
        "Google Pay",
        "Chase Orbital",
        "Vertex (tax)",
        "PCI DSS (SAQ A & D)",
        "Optimizely A/B testing",
      ],
    },
    {
      category: "Testing",
      featured: true,
      skills: [
        "JUnit",
        "Mockito",
        "Jest",
        "Vitest",
        "React Testing Library",
        "Playwright",
      ],
    },
    {
      category: "Observability",
      skills: ["New Relic", "Grafana", "PagerDuty", "CloudWatch"],
    },
    {
      category: "Build & Dev Tools",
      skills: [
        "Gradle",
        "Maven",
        "npm",
        "Yarn",
        "Prettier",
        "IntelliJ IDEA",
        "VS Code",
        "Postman",
        "Bruno",
        "Linux",
        "Bash / Zsh",
      ],
    },
    {
      category: "Collaboration",
      skills: [
        "Git",
        "GitHub",
        "GitLab",
        "Bitbucket",
        "Jira",
        "Confluence",
        "Agile",
      ],
    },
    {
      category: "AI-Assisted Development",
      skills: ["Claude Code", "GitHub Copilot"],
    },
    { category: "Currently Learning", skills: ["Python", "Go", "Rust"] },
  ],
  education: [
    {
      institution: "Fanshawe College",
      program: "Computer Programming Analyst",
      location: "London, ON",
      startYear: 2018,
      endYear: 2021,
      honours: ["President's Honour Roll"],
    },
  ],
  resumePdf: "/resume.pdf",
  siteUrl: "https://patrickkearney.dev",
  projects: [
    {
      name: "This Website",
      description:
        "A statically exported Next.js resume site with an interactive terminal and a mini-golf game built on canvas with hand-written physics. Typed content, JSON-LD for search, and unit, end-to-end and accessibility tests in CI.",
      tech: [
        "Next.js",
        "TypeScript",
        "Tailwind CSS",
        "Canvas API",
        "Vitest",
        "Playwright",
      ],
      links: [
        {
          label: "Source",
          href: "https://github.com/peakears/resume-site",
        },
      ],
    },
  ],
};
