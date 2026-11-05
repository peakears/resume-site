import type { ReactNode } from "react";

interface SectionProps {
  id: string;
  title: string;
  children: ReactNode;
}

export function Section({ id, title, children }: SectionProps) {
  const headingId = `${id}-heading`;
  return (
    <section id={id} aria-labelledby={headingId} className="scroll-mt-24 py-16">
      <h2 id={headingId} className="mb-8 text-2xl font-semibold tracking-tight">
        {title}
      </h2>
      {children}
    </section>
  );
}
