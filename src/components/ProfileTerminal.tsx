import type { ReactNode } from "react";

interface ProfileTerminalProps {
  name: string;
  role: string;
  company?: string;
  location?: string;
  stack: string[];
  focus: string[];
}

const Str = ({ children }: { children: ReactNode }) => (
  <span className="text-terminal-string">&quot;{children}&quot;</span>
);

function StringArray({ items }: { items: string[] }) {
  return (
    <>
      [
      {items.map((item, i) => (
        <span key={item}>
          {i > 0 && ", "}
          <Str>{item}</Str>
        </span>
      ))}
      ]
    </>
  );
}

/**
 * A terminal window that "prints" a few profile facts as code. The text is
 * real (not an image), so it stays readable and selectable.
 */
export function ProfileTerminal({
  name,
  role,
  company,
  location,
  stack,
  focus,
}: ProfileTerminalProps) {
  const variable = name.split(/\s+/)[0].toLowerCase();
  const textFields = Object.entries({ role, company, location }).filter(
    (entry): entry is [string, string] => Boolean(entry[1]),
  );
  const fields: [string, ReactNode][] = [
    ...textFields.map(([key, value]): [string, ReactNode] => [
      key,
      <Str key={key}>{value}</Str>,
    ]),
    ["stack", <StringArray key="stack" items={stack} />],
    ["focus", <StringArray key="focus" items={focus} />],
  ];

  return (
    <figure
      aria-label="Profile summary, written as code"
      className="bg-terminal text-terminal-foreground border-terminal-border w-full overflow-hidden rounded-xl border shadow-xl shadow-black/10 print:hidden"
    >
      <div
        aria-hidden="true"
        className="border-terminal-border flex items-center gap-2 border-b px-4 py-3"
      >
        <span className="bg-terminal-close size-3 rounded-full" />
        <span className="bg-terminal-minimize size-3 rounded-full" />
        <span className="bg-terminal-zoom size-3 rounded-full" />
        <span className="text-terminal-muted ml-2 font-mono text-xs">
          ~/{variable}
        </span>
      </div>
      <pre className="p-5 font-mono text-[0.75rem] leading-relaxed whitespace-pre-wrap">
        <code>
          <span className="text-terminal-muted">$</span> cat profile.ts{"\n"}
          <span className="text-terminal-muted">export const</span> {variable} ={" "}
          {"{\n"}
          {fields.map(([key, value]) => (
            <span key={key}>
              {"  "}
              <span className="text-terminal-key">{key}</span>: {value},{"\n"}
            </span>
          ))}
          {"};\n"}
          <span className="text-terminal-muted">$</span>{" "}
          <span
            aria-hidden="true"
            className="bg-terminal-key inline-block h-[1.1em] w-[0.55em] translate-y-[0.2em] animate-pulse motion-reduce:animate-none"
          />
        </code>
      </pre>
    </figure>
  );
}
