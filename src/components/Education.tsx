import type { Education as EducationEntry } from "@/data/profile";
import { Section } from "./Section";

export function Education({ entries }: { entries: EducationEntry[] }) {
  return (
    <Section id="education" title="Education">
      <ul className="space-y-6">
        {entries.map((entry) => (
          <li key={`${entry.institution}-${entry.program}`} className="reveal">
            <article>
              <h3 className="text-lg font-semibold">
                {entry.program}{" "}
                <span className="text-muted">· {entry.institution}</span>
              </h3>
              <p className="text-muted text-sm">
                {entry.startYear} – {entry.endYear} · {entry.location}
              </p>
              {entry.honours.length > 0 && (
                <ul
                  aria-label={`Honours at ${entry.institution}`}
                  className="mt-3 space-y-1 print:mt-1"
                >
                  {entry.honours.map((honour) => (
                    <li key={honour} className="flex items-center gap-2">
                      <span aria-hidden="true" className="text-accent">
                        ★
                      </span>
                      {honour}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </li>
        ))}
      </ul>
    </Section>
  );
}
