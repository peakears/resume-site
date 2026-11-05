import { ThemeToggle } from "./ThemeToggle";

export const NAV_ITEMS = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "education", label: "Education" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "contact", label: "Contact" },
] as const;

export function Header({ name }: { name: string }) {
  return (
    <header className="border-border bg-background/80 sticky top-0 z-10 border-b backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <a href="#top" className="font-semibold tracking-tight">
          {name}
        </a>
        <nav aria-label="Main" className="hidden md:block">
          <ul className="text-muted flex gap-6 text-sm">
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="hover:text-foreground">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
