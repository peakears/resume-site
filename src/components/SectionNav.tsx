"use client";

import { useEffect, useState } from "react";

export interface NavItem {
  id: string;
  label: string;
}

/** How far down the viewport a section's top must reach to count as current. */
const ACTIVE_LINE = 0.35;

/**
 * Returns the id of the section being read: the last one whose top has
 * passed the active line. At the very bottom of the page, the last section
 * wins, since a short final section may never reach the line.
 */
export function currentSection(
  ids: readonly string[],
  viewportHeight: number,
  atBottom: boolean,
): string | null {
  if (atBottom && ids.length > 0) return ids[ids.length - 1];
  let current: string | null = null;
  for (const id of ids) {
    const top = document.getElementById(id)?.getBoundingClientRect().top;
    if (top !== undefined && top <= viewportHeight * ACTIVE_LINE) current = id;
  }
  return current;
}

/** In-page navigation that highlights the section in view. */
export function SectionNav({ items }: { items: readonly NavItem[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const ids = items.map((item) => item.id);
    let frame = 0;
    const update = () => {
      frame = 0;
      const root = document.documentElement;
      const atBottom =
        window.scrollY > 0 &&
        window.innerHeight + window.scrollY >= root.scrollHeight - 2;
      setActive(currentSection(ids, window.innerHeight, atBottom));
    };
    // At most one update per frame while scrolling.
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [items]);

  return (
    <nav aria-label="Main" className="hidden md:block">
      <ul className="text-muted flex gap-6 text-sm">
        {items.map((item) => {
          const isActive = item.id === active;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={isActive ? "location" : undefined}
                className={`hover:text-foreground border-b-2 pb-0.5 transition-colors motion-reduce:transition-none ${
                  isActive
                    ? "text-foreground border-accent"
                    : "border-transparent"
                }`}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
