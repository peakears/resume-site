import type { ReactNode } from "react";
import { NAV_ITEMS } from "./Header";

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
  // Number sections in nav order ("01.", "02.", ...) as a visual landmark.
  const index = NAV_ITEMS.findIndex((item) => item.id === id);
  const number = index >= 0 ? String(index + 1).padStart(2, "0") : null;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={`lg:even:bg-surface scroll-mt-14 py-14 lg:py-20 print:py-1 ${hideInPrint ? "print:hidden" : ""}`}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 print:max-w-none print:px-0">
        <h2
          id={headingId}
          className="reveal after:bg-border print:border-border mb-10 flex items-baseline gap-3 text-3xl font-bold tracking-tight after:h-px after:flex-1 after:self-center sm:text-4xl print:mb-2 print:block print:border-b print:pb-0.5 print:text-base print:font-semibold print:tracking-wide print:uppercase print:after:hidden"
        >
          {number && (
            <span
              aria-hidden="true"
              className="text-accent font-mono text-base font-medium print:hidden"
            >
              {number}.
            </span>
          )}
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}
