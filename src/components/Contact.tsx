import type { Link } from "@/data/profile";
import { Section } from "./Section";

export function Contact({
  email,
  socials,
}: {
  email: string;
  socials: Link[];
}) {
  return (
    <Section id="contact" title="Contact">
      <p className="mb-6 max-w-xl text-lg leading-relaxed">
        I&apos;m open to new opportunities. The best way to reach me is by
        email.
      </p>
      <ul className="flex flex-wrap gap-4">
        <li>
          <a
            href={`mailto:${email}`}
            className="bg-accent text-accent-foreground rounded-md px-5 py-2.5 text-sm font-medium hover:opacity-90"
          >
            {email}
          </a>
        </li>
        {socials.map((social) => (
          <li key={social.href}>
            <a
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="border-border hover:bg-surface inline-block rounded-md border px-5 py-2.5 text-sm font-medium"
            >
              {social.label}{" "}
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}
