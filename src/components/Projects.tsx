import type { Project } from "@/data/profile";
import { Section } from "./Section";
import { TagList } from "./TagList";

export function Projects({ projects }: { projects: Project[] }) {
  return (
    <Section id="projects" title="Projects">
      <div className="grid gap-6 sm:grid-cols-2 print:block">
        {projects.map((project) => (
          <article
            key={project.name}
            className="reveal border-border flex flex-col rounded-lg border p-5 print:border-0 print:p-0"
          >
            <h3 className="mb-2 font-semibold print:mb-0">{project.name}</h3>
            <p className="text-muted mb-4 flex-1 leading-relaxed print:mb-1">
              {project.description}
            </p>
            <TagList
              items={project.tech}
              label={`Technologies used in ${project.name}`}
            />
            {project.links.length > 0 && (
              <ul className="mt-4 flex gap-4 text-sm print:hidden">
                {project.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent underline-offset-4 hover:underline"
                    >
                      {link.label}{" "}
                      <span className="sr-only">
                        for {project.name} (opens in a new tab)
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </Section>
  );
}
