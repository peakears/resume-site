import type { Profile } from "@/data/profile";
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
> & { now?: Date };

export function Hero({
  name,
  title,
  location,
  availability,
  summary,
  careerStart,
  email,
  now,
}: HeroProps) {
  const years = yearsSince(careerStart, now);
  return (
    <section aria-labelledby="hero-heading" className="pt-20 pb-12 sm:pt-28">
      <p className="text-accent mb-3 font-mono text-sm">Hi, I&apos;m</p>
      <h1
        id="hero-heading"
        className="text-4xl font-bold tracking-tight sm:text-6xl"
      >
        {name}
      </h1>
      <p className="text-muted mt-4 text-xl sm:text-2xl">
        {title}
        {years > 0 && <> · {years}+ years of experience</>}
      </p>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed">{summary}</p>
      <p className="text-muted mt-4 text-sm">
        {location} · {availability}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href={`mailto:${email}`}
          className="bg-accent text-accent-foreground rounded-md px-5 py-2.5 text-sm font-medium hover:opacity-90"
        >
          Get in touch
        </a>
        <a
          href="#experience"
          className="border-border hover:bg-surface rounded-md border px-5 py-2.5 text-sm font-medium"
        >
          View experience
        </a>
      </div>
    </section>
  );
}
