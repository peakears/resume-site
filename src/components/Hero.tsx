import type { ReactNode } from "react";
import type { Profile } from "@/data/profile";
import { Avatar } from "./Avatar";
import { yearsSince } from "@/lib/dates";

type HeroProps = Pick<
  Profile,
  | "name"
  | "title"
  | "location"
  | "availability"
  | "summary"
  | "careerStart"
  | "email"
  | "resumePdf"
  | "socials"
  | "headshot"
> & {
  /** Shown beside the intro on large screens and below it on small ones. */
  aside?: ReactNode;
  now?: Date;
};

export function Hero({
  name,
  title,
  location,
  availability,
  summary,
  careerStart,
  email,
  resumePdf,
  socials,
  headshot,
  aside,
  now,
}: HeroProps) {
  const years = yearsSince(careerStart, now);
  return (
    <section
      aria-labelledby="hero-heading"
      className="pt-20 pb-12 sm:pt-28 lg:pb-24 print:pt-0 print:pb-2"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-center lg:gap-10 print:block print:max-w-none print:px-0">
        <div>
          <Avatar name={name} headshot={headshot} />
          <p className="text-accent mt-6 mb-3 font-mono text-sm print:hidden">
            Hi, I&apos;m
          </p>
          <h1
            id="hero-heading"
            className="text-4xl font-bold tracking-tight sm:text-6xl print:text-3xl"
          >
            {name}
          </h1>
          <p className="text-muted mt-4 text-xl sm:text-2xl print:mt-1 print:text-lg">
            {title}
            {years > 0 && <> · {years}+ years of experience</>}
          </p>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed print:mt-2 print:max-w-none print:text-base">
            {summary}
          </p>
          <p className="text-muted mt-4 text-sm print:mt-2">
            {location} · {availability}
            <span className="hidden print:inline">
              {" · "}
              {email}
              {socials.map(
                (s) =>
                  ` · ${s.href.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}`,
              )}
            </span>
          </p>
          <div className="mt-8 flex flex-wrap gap-3 print:hidden">
            <a
              href={`mailto:${email}`}
              className="bg-accent text-accent-foreground rounded-md px-5 py-2.5 text-sm font-medium hover:opacity-90"
            >
              Get in touch
            </a>
            <a
              href={resumePdf}
              download
              className="border-border hover:bg-surface rounded-md border px-5 py-2.5 text-sm font-medium"
            >
              Download resume (PDF)
            </a>
            <a
              href="#experience"
              className="border-border hover:bg-surface rounded-md border px-5 py-2.5 text-sm font-medium"
            >
              View experience
            </a>
          </div>
        </div>
        {aside && <div className="mt-12 lg:mt-0 print:hidden">{aside}</div>}
      </div>
    </section>
  );
}
