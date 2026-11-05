import type { SkillGroup } from "@/data/profile";
import { Section } from "./Section";
import { TagList } from "./TagList";

export function Skills({ groups }: { groups: SkillGroup[] }) {
  return (
    <Section id="skills" title="Skills">
      <div className="grid gap-6 sm:grid-cols-2 print:grid-cols-1 print:gap-1">
        {groups.map((group) => (
          <div
            key={group.category}
            className="border-border rounded-lg border p-5 print:flex print:items-baseline print:gap-2 print:border-0 print:p-0"
          >
            <h3 className="mb-3 font-semibold print:mb-0 print:shrink-0 print:after:content-[':']">
              {group.category}
            </h3>
            <TagList items={group.skills} label={`${group.category} skills`} />
          </div>
        ))}
      </div>
    </Section>
  );
}
