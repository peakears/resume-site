import type { ReactNode } from "react";

interface SectionProps {
  id: string;
  title: string;
  children: ReactNode;
  /** Leave this section out of printed copies and the PDF resume. */
  hideInPrint?: boolean;
}

/**
 * A full-width band. On desktop, every other band gets the surface colour
 * so each section reads as its own "page"; the content stays centred.
 */
export function Section({
  id,
  title,
  children,
  hideInPrint = false,
}: SectionProps) {
  const headingId = `${id}-heading`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={`lg:even:bg-surface scroll-mt-14 py-16 lg:py-24 print:py-2 ${hideInPrint ? "print:hidden" : ""}`}
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 print:max-w-none print:px-0">
        <h2
          id={headingId}
          className="print:border-border mb-8 text-2xl font-semibold tracking-tight print:mb-2 print:border-b print:pb-0.5 print:text-base print:tracking-wide print:uppercase"
        >
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}
