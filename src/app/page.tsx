import { Contact } from "@/components/Contact";
import { Education } from "@/components/Education";
import { Experience } from "@/components/Experience";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Projects } from "@/components/Projects";
import { Section } from "@/components/Section";
import { Skills } from "@/components/Skills";
import { profile } from "@/data/profile";

export default function Home() {
  return (
    <>
      <a
        href="#main"
        className="focus:bg-accent focus:text-accent-foreground sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-20 focus:rounded focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <Header name={profile.name} />
      <main id="main" className="w-full flex-1">
        <Hero {...profile} />
        <Section id="about" title="About" hideInPrint>
          <div className="max-w-2xl space-y-4 text-lg leading-relaxed print:max-w-none print:text-base">
            <p className="text-xl font-semibold tracking-tight sm:text-2xl">
              {profile.aboutHeadline}
            </p>
            {profile.about.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </Section>
        <Experience roles={profile.experience} />
        <Education entries={profile.education} />
        <Skills groups={profile.skills} />
        <Projects projects={profile.projects} />
        <Contact
          email={profile.email}
          socials={profile.socials}
          resumePdf={profile.resumePdf}
        />
      </main>
      <footer className="border-border text-muted border-t py-8 text-center text-sm print:hidden">
        © {new Date().getFullYear()} {profile.name}. Built with Next.js and
        TypeScript.
      </footer>
    </>
  );
}
