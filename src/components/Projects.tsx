import type { Project } from "@/data/profile";
import { Section } from "./Section";
import { TagList } from "./TagList";

export function Projects({ projects }: { projects: Project[] }) {
  return (
    <Section id="projects" title="Projects">
      <div className="grid gap-6 sm:grid-cols-2">
        {projects.map((project) => (
          <article
            key={project.name}
            className="border-border flex flex-col rounded-lg border p-5"
          >
            <h3 className="mb-2 font-semibold">{project.name}</h3>
            <p className="text-muted mb-4 flex-1 leading-relaxed">
              {project.description}
            </p>
            <TagList
              items={project.tech}
              label={`Technologies used in ${project.name}`}
            />
            {project.links.length > 0 && (
              <ul className="mt-4 flex gap-4 text-sm">
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
