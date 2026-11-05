import type { Role } from "@/data/profile";
import { formatDateRange } from "@/lib/dates";
import { Section } from "./Section";
import { TagList } from "./TagList";

export function Experience({ roles }: { roles: Role[] }) {
  return (
    <Section id="experience" title="Experience">
      <ol className="border-border space-y-10 border-l pl-6">
        {roles.map((role) => (
          <li key={`${role.company}-${role.start}`} className="relative">
            <span
              aria-hidden="true"
              className="bg-accent absolute top-2 -left-[29px] h-2.5 w-2.5 rounded-full"
            />
            <article>
              <header className="mb-3">
                <h3 className="text-lg font-semibold">
                  {role.title}{" "}
                  <span className="text-muted">· {role.company}</span>
                </h3>
                <p className="text-muted text-sm">
                  <time dateTime={role.start}>
                    {formatDateRange(role.start, role.end)}
                  </time>{" "}
                  · {role.location}
                </p>
              </header>
              <ul className="mb-4 list-disc space-y-1.5 pl-5 leading-relaxed">
                {role.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
              <TagList
                items={role.tech}
                label={`Technologies used at ${role.company}`}
              />
            </article>
          </li>
        ))}
      </ol>
    </Section>
  );
}
