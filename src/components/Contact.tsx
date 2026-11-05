import type { Link } from "@/data/profile";
import { Section } from "./Section";

interface ContactProps {
  email: string;
  socials: Link[];
  resumePdf: string;
}

const secondaryButton =
  "border-border hover:bg-background inline-block rounded-md border px-5 py-2.5 text-sm font-medium print:border-0 print:p-0";

export function Contact({ email, socials, resumePdf }: ContactProps) {
  return (
    <Section id="contact" title="Contact" hideInPrint>
      <p className="mb-6 max-w-xl text-lg leading-relaxed print:hidden">
        I&apos;m open to new opportunities. The best way to reach me is by
        email.
      </p>
      <ul className="flex flex-wrap gap-4 print:flex-col print:gap-1">
        <li>
          <a
            href={`mailto:${email}`}
            className="bg-accent text-accent-foreground rounded-md px-5 py-2.5 text-sm font-medium hover:opacity-90 print:bg-transparent print:p-0 print:text-inherit"
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
              className={secondaryButton}
            >
              {social.label}{" "}
              <span className="sr-only">(opens in a new tab)</span>
              {/* Printed copies can't be clicked, so show the address. */}
              <span aria-hidden="true" className="hidden print:inline">
                : {social.href.replace(/^https?:\/\//, "")}
              </span>
            </a>
          </li>
        ))}
        <li className="print:hidden">
          <a href={resumePdf} download className={secondaryButton}>
            Download resume (PDF)
          </a>
        </li>
      </ul>
    </Section>
  );
}
