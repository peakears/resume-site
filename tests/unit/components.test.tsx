import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { Avatar } from "@/components/Avatar";
import { Contact } from "@/components/Contact";
import { Education } from "@/components/Education";
import { GolfGame } from "@/components/GolfGame";
import { Experience } from "@/components/Experience";
import { Hero } from "@/components/Hero";
import { ProfileTerminal } from "@/components/ProfileTerminal";
import { Projects } from "@/components/Projects";
import { Section } from "@/components/Section";
import { Skills } from "@/components/Skills";
import type { Profile } from "@/data/profile";

// jsdom has no canvas; the game skips drawing when there's no context.
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() =>
    null) as unknown as HTMLCanvasElement["getContext"];
});

const fixture: Profile = {
  name: "Test Person",
  title: "Software Engineer",
  location: "London, Ontario, Canada",
  availability: "Open to remote",
  summary: "Builds things.",
  aboutHeadline: "Headline.",
  about: ["Paragraph one."],
  coreStack: ["TypeScript", "AWS"],
  focus: ["payments"],
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
  education: [
    {
      institution: "Test College",
      program: "Computer Programming",
      location: "London, ON",
      startYear: 2018,
      endYear: 2021,
      honours: ["Dean's List"],
    },
  ],
  resumePdf: "/resume.pdf",
  siteUrl: "https://example.dev",
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

  it("offers the PDF resume as a download", () => {
    render(<Hero {...fixture} />);
    const link = screen.getByRole("link", { name: "Download resume (PDF)" });
    expect(link).toHaveAttribute("href", "/resume.pdf");
    expect(link).toHaveAttribute("download");
  });
});

describe("Education", () => {
  it("shows the program, school, years and honours", () => {
    render(<Education entries={fixture.education} />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Education" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Computer Programming · Test College",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("2018 – 2021 · London, ON")).toBeInTheDocument();
    const honours = screen.getByRole("list", {
      name: "Honours at Test College",
    });
    expect(within(honours).getByText("Dean's List")).toBeInTheDocument();
  });

  it("omits the honours list when there are none", () => {
    render(<Education entries={[{ ...fixture.education[0], honours: [] }]} />);
    expect(
      screen.queryByRole("list", { name: /Honours/ }),
    ).not.toBeInTheDocument();
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

  it("omits the technology list for a role with none listed", () => {
    render(<Experience roles={[{ ...fixture.experience[0], tech: [] }]} />);
    expect(
      screen.queryByRole("list", { name: /Technologies used/ }),
    ).not.toBeInTheDocument();
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
    render(<Contact {...fixture} />);
    expect(
      screen.getByRole("link", { name: "test@example.com" }),
    ).toHaveAttribute("href", "mailto:test@example.com");
    expect(
      screen.getByRole("link", { name: "GitHub (opens in a new tab)" }),
    ).toHaveAttribute("href", "https://github.com/test");
  });

  it("offers the PDF resume as a download", () => {
    render(<Contact {...fixture} />);
    expect(
      screen.getByRole("link", { name: "Download resume (PDF)" }),
    ).toHaveAttribute("href", "/resume.pdf");
  });
});

describe("Hero layout", () => {
  it("renders the aside next to the intro", () => {
    render(<Hero {...fixture} aside={<p>Side content</p>} />);
    expect(screen.getByText("Side content")).toBeInTheDocument();
  });
});

describe("Avatar", () => {
  it("shows the headshot with its alt text", () => {
    render(
      <Avatar
        name="Test Person"
        headshot={{ src: "/me.jpg", alt: "Photo of Test Person" }}
      />,
    );
    expect(
      screen.getByRole("img", { name: "Photo of Test Person" }),
    ).toBeInTheDocument();
  });

  it("falls back to decorative initials without a photo", () => {
    render(<Avatar name="Test Person" />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("TP")).toHaveAttribute("aria-hidden", "true");
  });
});

describe("ProfileTerminal", () => {
  const terminal = (props: Partial<Parameters<typeof ProfileTerminal>[0]>) =>
    render(
      <ProfileTerminal
        name="Test Person"
        role="Engineer"
        company="Acme"
        stack={["Go", "AWS"]}
        focus={["payments"]}
        data={fixture}
        {...props}
      />,
    );

  const run = async (user: ReturnType<typeof userEvent.setup>, text: string) =>
    user.type(
      screen.getByRole("textbox", { name: "Terminal command" }),
      `${text}{Enter}`,
    );

  it("prints the profile facts as code", () => {
    terminal({});
    const text =
      screen.getByRole("figure", { name: "Profile summary, written as code" })
        .textContent ?? "";
    expect(text).toContain("export const test = {");
    expect(text).toContain('role: "Engineer",');
    expect(text).toContain('company: "Acme",');
    expect(text).toContain('stack: ["Go", "AWS"],');
    expect(text).toContain('focus: ["payments"],');
  });

  it("leaves out fields that aren't provided", () => {
    terminal({ company: undefined });
    expect(screen.getByRole("figure").textContent).not.toContain("company");
  });

  it("runs commands typed at the prompt", async () => {
    const user = userEvent.setup();
    terminal({});
    await run(user, "about");
    expect(screen.getByText("Headline.")).toBeInTheDocument();

    await run(user, "contact");
    expect(
      screen.getByRole("link", { name: "test@example.com" }),
    ).toHaveAttribute("href", "mailto:test@example.com");

    await run(user, "nope");
    expect(screen.getByText(/command not found: nope/)).toBeInTheDocument();
  });

  it("recalls earlier commands with the up arrow", async () => {
    const user = userEvent.setup();
    terminal({});
    await run(user, "help");
    await run(user, "about");
    const input = screen.getByRole("textbox", { name: "Terminal command" });
    await user.keyboard("{ArrowUp}");
    expect(input).toHaveValue("about");
    await user.keyboard("{ArrowUp}");
    expect(input).toHaveValue("help");
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(input).toHaveValue("");
  });

  it("clears the screen", async () => {
    const user = userEvent.setup();
    terminal({});
    await run(user, "about");
    await run(user, "clear");
    expect(screen.queryByText("Headline.")).not.toBeInTheDocument();
    expect(screen.getByRole("figure").textContent).not.toContain(
      "cat profile.ts",
    );
  });

  it("shows a blinking cursor until the prompt is focused or has text", async () => {
    const user = userEvent.setup();
    const { container } = terminal({});
    const cursor = () => container.querySelector("[data-terminal-cursor]");
    expect(cursor()).toHaveAttribute("aria-hidden", "true");

    const input = screen.getByRole("textbox", { name: "Terminal command" });
    await user.click(input);
    expect(cursor()).toBeNull();

    await user.type(input, "he");
    await user.tab();
    expect(cursor()).toBeNull();

    await user.clear(input);
    await user.tab();
    expect(cursor()).not.toBeNull();
  });

  it("opens the golf game", async () => {
    const user = userEvent.setup();
    terminal({});
    await run(user, "golf");
    expect(
      await screen.findByRole("dialog", { name: "Mini golf" }),
    ).toBeInTheDocument();
  });
});

describe("GolfGame", () => {
  it("starts on the first hole with no strokes", () => {
    render(<GolfGame onClose={() => {}} />);
    const dialog = screen.getByRole("dialog", { name: "Mini golf" });
    expect(dialog).toHaveTextContent("Hole 1 of 3");
    expect(dialog).toHaveTextContent("Strokes 0");
    expect(
      screen.getByRole("application", { name: "Putting green" }),
    ).toBeInTheDocument();
  });

  it("aims and putts with the keyboard", async () => {
    const user = userEvent.setup();
    render(<GolfGame onClose={() => {}} />);
    screen.getByRole("application", { name: "Putting green" }).focus();

    await user.keyboard("{ArrowUp}");
    expect(screen.getByText(/Power 55%/)).toBeInTheDocument();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByText(/Aim 2°/)).toBeInTheDocument();

    await user.keyboard(" ");
    expect(screen.getByRole("dialog")).toHaveTextContent("Strokes 1");
  });

  it("closes from the Close button", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<GolfGame onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe("Section", () => {
  it("numbers sections in nav order without changing the heading's name", () => {
    render(
      <Section id="experience" title="Experience">
        <p>Body</p>
      </Section>,
    );
    const heading = screen.getByRole("heading", {
      level: 2,
      name: "Experience",
    });
    expect(heading).toHaveTextContent("02.Experience");
  });
});

describe("Skills toggle", () => {
  const groups = [
    { category: "Languages", skills: ["Java"], featured: true },
    { category: "Cloud", skills: ["AWS"], featured: true },
    { category: "Tools", skills: ["Git"] },
  ];

  // Visibility comes from Tailwind classes, which jsdom doesn't load, so the
  // E2E suite checks what's actually shown. Here we check the toggle state.
  it("toggles the extra groups with an accessible button", async () => {
    const user = userEvent.setup();
    render(<Skills groups={groups} />);

    // Every group is in the document, so printed copies can include them all.
    expect(
      screen.getByRole("list", { name: "Tools skills" }),
    ).toBeInTheDocument();

    const button = screen.getByRole("button", {
      name: "Show all skills (1 more groups)",
    });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveAttribute("aria-controls", "skills-list");

    await user.click(button);
    expect(
      screen.getByRole("button", { name: "Show fewer skills" }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("shows every group, with no toggle, when none are featured", () => {
    render(<Skills groups={[{ category: "Tools", skills: ["Git"] }]} />);
    expect(screen.getByRole("list", { name: "Tools skills" })).toBeVisible();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
