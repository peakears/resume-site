import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Contact } from "@/components/Contact";
import { Experience } from "@/components/Experience";
import { Hero } from "@/components/Hero";
import { Projects } from "@/components/Projects";
import { Skills } from "@/components/Skills";
import type { Profile } from "@/data/profile";

const fixture: Profile = {
  name: "Test Person",
  title: "Software Engineer",
  location: "London, Ontario, Canada",
  availability: "Open to remote",
  summary: "Builds things.",
  about: ["Paragraph one."],
  careerStart: "2022-01",
  email: "test@example.com",
  socials: [{ label: "GitHub", href: "https://github.com/test" }],
  experience: [
    {
      company: "Acme",
      title: "Engineer",
      location: "Remote",
      start: "2023-02",
      end: null,
      highlights: ["Shipped a thing"],
      tech: ["TypeScript"],
    },
    {
      company: "Globex",
      title: "Junior Engineer",
      location: "London, ON",
      start: "2022-01",
      end: "2023-01",
      highlights: ["Fixed a bug"],
      tech: ["Java"],
    },
  ],
  skills: [{ category: "Languages", skills: ["TypeScript", "Go"] }],
  projects: [
    {
      name: "Widget",
      description: "A widget.",
      tech: ["React"],
      links: [{ label: "Source", href: "https://github.com/test/widget" }],
    },
  ],
};

describe("Hero", () => {
  it("renders the name as the page's h1 with computed experience", () => {
    render(<Hero {...fixture} now={new Date(2027, 0, 15)} />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Test Person" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/5\+ years of experience/)).toBeInTheDocument();
  });

  it("links the call to action to the email address", () => {
    render(<Hero {...fixture} />);
    expect(screen.getByRole("link", { name: "Get in touch" })).toHaveAttribute(
      "href",
      "mailto:test@example.com",
    );
  });
});

describe("Experience", () => {
  it("renders every role in order with its date range", () => {
    render(<Experience roles={fixture.experience} />);
    const roles = screen.getAllByRole("article");
    expect(roles).toHaveLength(2);
    expect(
      within(roles[0]).getByText("Feb 2023 – Present"),
    ).toBeInTheDocument();
    expect(
      within(roles[1]).getByText("Jan 2022 – Jan 2023"),
    ).toBeInTheDocument();
  });

  it("lists each role's technologies", () => {
    render(<Experience roles={fixture.experience} />);
    const tech = screen.getByRole("list", {
      name: "Technologies used at Acme",
    });
    expect(within(tech).getByText("TypeScript")).toBeInTheDocument();
  });
});

describe("Skills", () => {
  it("groups skills under their category", () => {
    render(<Skills groups={fixture.skills} />);
    const list = screen.getByRole("list", { name: "Languages skills" });
    expect(
      within(list)
        .getAllByRole("listitem")
        .map((li) => li.textContent),
    ).toEqual(["TypeScript", "Go"]);
  });
});

describe("Projects", () => {
  it("opens external links safely in a new tab", () => {
    render(<Projects projects={fixture.projects} />);
    const link = screen.getByRole("link", {
      name: "Source for Widget (opens in a new tab)",
    });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});

describe("Contact", () => {
  it("renders the email and social links", () => {
    render(<Contact email={fixture.email} socials={fixture.socials} />);
    expect(
      screen.getByRole("link", { name: "test@example.com" }),
    ).toHaveAttribute("href", "mailto:test@example.com");
    expect(
      screen.getByRole("link", { name: "GitHub (opens in a new tab)" }),
    ).toHaveAttribute("href", "https://github.com/test");
  });
});
