"use client";

import { useState } from "react";
import type { SkillGroup } from "@/data/profile";
import { Section } from "./Section";
import { TagList } from "./TagList";

const LIST_ID = "skills-list";

/**
 * Skills as compact rows: category on the left, tags on the right. Featured
 * groups show first; the rest sit behind "Show all skills". Printed copies
 * (and the PDF resume) always include every group.
 */
export function Skills({ groups }: { groups: SkillGroup[] }) {
  const [expanded, setExpanded] = useState(false);

  // With nothing marked as featured, show everything.
  const hasFeatured = groups.some((group) => group.featured);
  const featured = hasFeatured ? groups.filter((g) => g.featured) : groups;
  const others = hasFeatured ? groups.filter((g) => !g.featured) : [];

  const row = (group: SkillGroup, collapsed: boolean) => (
    <div
      key={group.category}
      className={`reveal border-border gap-x-6 gap-y-2 border-b py-4 last:border-b-0 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-baseline print:flex print:items-baseline print:gap-2 print:border-0 print:py-0 ${collapsed ? "hidden" : "grid"}`}
    >
      <h3 className="font-semibold print:shrink-0 print:after:content-[':']">
        {group.category}
      </h3>
      <TagList items={group.skills} label={`${group.category} skills`} />
    </div>
  );

  return (
    <Section id="skills" title="Skills">
      <div id={LIST_ID}>
        {featured.map((group) => row(group, false))}
        {others.map((group) => row(group, !expanded))}
      </div>
      {others.length > 0 && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={LIST_ID}
          onClick={() => setExpanded((value) => !value)}
          className="border-border hover:bg-surface mt-6 rounded-md border px-4 py-2 text-sm font-medium print:hidden"
        >
          {expanded
            ? "Show fewer skills"
            : `Show all skills (${others.length} more groups)`}
        </button>
      )}
    </Section>
  );
}
