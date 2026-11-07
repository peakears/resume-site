import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SectionNav } from "@/components/SectionNav";

const items = [
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "contact", label: "Contact" },
];

/** Puts each section at a given distance from the top of the viewport. */
function placeSections(tops: Record<string, number>) {
  for (const [id, top] of Object.entries(tops)) {
    const section = document.createElement("section");
    section.id = id;
    section.getBoundingClientRect = () => ({ top }) as DOMRect;
    document.body.appendChild(section);
  }
}

afterEach(() => {
  document.querySelectorAll("section").forEach((s) => s.remove());
  vi.restoreAllMocks();
});

describe("SectionNav", () => {
  it("links to each section", () => {
    render(<SectionNav items={items} />);
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(screen.getByRole("link", { name: "Skills" })).toHaveAttribute(
      "href",
      "#skills",
    );
    expect(nav).toBeInTheDocument();
  });

  it("marks the section that has scrolled past the top third as current", () => {
    // jsdom's window is 768px tall, so the active line is at ~269px.
    placeSections({ about: -900, skills: 120, contact: 700 });
    render(<SectionNav items={items} />);

    expect(screen.getByRole("link", { name: "Skills" })).toHaveAttribute(
      "aria-current",
      "location",
    );
    expect(screen.getByRole("link", { name: "About" })).not.toHaveAttribute(
      "aria-current",
    );
    expect(screen.getByRole("link", { name: "Contact" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("marks nothing as current above the first section", () => {
    placeSections({ about: 900, skills: 1800, contact: 2600 });
    render(<SectionNav items={items} />);
    for (const link of screen.getAllByRole("link")) {
      expect(link).not.toHaveAttribute("aria-current");
    }
  });
});
