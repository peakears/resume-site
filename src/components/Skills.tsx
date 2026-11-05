import type { SkillGroup } from "@/data/profile";
import { Section } from "./Section";
import { TagList } from "./TagList";

export function Skills({ groups }: { groups: SkillGroup[] }) {
  return (
    <Section id="skills" title="Skills">
      <div className="grid gap-6 sm:grid-cols-2">
        {groups.map((group) => (
          <div
            key={group.category}
            className="border-border rounded-lg border p-5"
          >
            <h3 className="mb-3 font-semibold">{group.category}</h3>
            <TagList items={group.skills} label={`${group.category} skills`} />
          </div>
        ))}
      </div>
    </Section>
  );
}
