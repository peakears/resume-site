"use client";

import {
  Suspense,
  lazy,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  completeCommand,
  runCommand,
  type TerminalData,
  type TerminalLine,
} from "@/lib/terminal";

// The game only downloads when someone types "golf".
const GolfGame = lazy(() =>
  import("./GolfGame").then((module) => ({ default: module.GolfGame })),
);

interface ProfileTerminalProps {
  name: string;
  role: string;
  company?: string;
  location?: string;
  stack: string[];
  focus: string[];
  /** Content the commands can print. */
  data: TerminalData;
}

// No wrapping inside a string, so long lists break between items.
const Str = ({ children }: { children: ReactNode }) => (
  <span className="text-terminal-string whitespace-nowrap">
    &quot;{children}&quot;
  </span>
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

const Prompt = () => (
  <span aria-hidden="true" className="text-terminal-muted select-none">
    ${" "}
  </span>
);

function Line({ line }: { line: TerminalLine }) {
  if (line.kind === "link") {
    return (
      <p>
        <a
          href={line.href}
          download={line.download || undefined}
          target={line.external ? "_blank" : undefined}
          rel={line.external ? "noopener noreferrer" : undefined}
          className="text-terminal-key underline underline-offset-2 hover:no-underline"
        >
          {line.text}
          {line.external && (
            <span className="sr-only"> (opens in a new tab)</span>
          )}
        </a>
      </p>
    );
  }
  const colour = {
    command: "",
    output: "",
    muted: "text-terminal-muted",
    error: "text-terminal-error",
  }[line.kind];
  return (
    <p className={`whitespace-pre-wrap ${colour}`}>
      {line.kind === "command" && <Prompt />}
      {line.text}
    </p>
  );
}

/**
 * A terminal window that "prints" a few profile facts as code, then takes
 * commands. The text is real (not an image), so it stays readable.
 */
export function ProfileTerminal({
  name,
  role,
  company,
  location,
  stack,
  focus,
  data,
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

  const [showIntro, setShowIntro] = useState(true);
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [golfOpen, setGolfOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the newest output in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const typed = input.trim();
    setInput("");
    setHistoryIndex(null);
    if (!typed) return;
    setHistory((h) => [...h, typed]);

    const result = runCommand(typed, data);
    if (result.action === "clear") {
      setShowIntro(false);
      setLines([]);
      return;
    }
    setLines((l) => [...l, { kind: "command", text: typed }, ...result.lines]);
    if (result.action === "golf") setGolfOpen(true);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // Tab completes a command. It's only captured when it adds something,
    // so Tab still moves focus out of the terminal otherwise.
    if (event.key === "Tab" && !event.shiftKey) {
      const completed = completeCommand(input);
      if (completed !== input) {
        event.preventDefault();
        setInput(completed);
      }
      return;
    }
    // Up and down arrows step through earlier commands, like a real shell.
    if (history.length === 0) return;
    if (event.key === "ArrowUp") {
      event.preventDefault();
      const index =
        historyIndex === null
          ? history.length - 1
          : Math.max(0, historyIndex - 1);
      setHistoryIndex(index);
      setInput(history[index]);
    } else if (event.key === "ArrowDown" && historyIndex !== null) {
      event.preventDefault();
      const index = historyIndex + 1;
      if (index >= history.length) {
        setHistoryIndex(null);
        setInput("");
      } else {
        setHistoryIndex(index);
        setInput(history[index]);
      }
    }
  };

  // Clicking anywhere in the window focuses the prompt, unless selecting text.
  const focusPrompt = () => {
    if (!window.getSelection()?.toString()) inputRef.current?.focus();
  };

  return (
    <figure
      aria-label="Profile summary, written as code"
      className="bg-terminal text-terminal-foreground border-terminal-border focus-within:ring-accent w-full overflow-hidden rounded-xl border shadow-xl shadow-black/10 focus-within:ring-2 print:hidden"
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
      <div
        ref={scrollRef}
        onClick={focusPrompt}
        className="max-h-80 overflow-y-auto p-5 font-mono text-[0.75rem] leading-relaxed"
      >
        {showIntro && (
          <>
            <pre className="whitespace-pre-wrap">
              <code>
                <Prompt />
                cat profile.ts{"\n"}
                <span className="text-terminal-muted">export const</span>{" "}
                {variable} = {"{\n"}
                {fields.map(([key, value]) => (
                  // Indent like formatted code: 2 spaces, and 4 for a wrapped line.
                  <span key={key} className="block pl-[4ch] -indent-[2ch]">
                    <span className="text-terminal-key">{key}</span>: {value},
                  </span>
                ))}
                {"};"}
              </code>
            </pre>
            <p className="text-terminal-muted mt-2">
              Type <span className="text-terminal-key">help</span> for commands,
              or <span className="text-terminal-key">golf</span> to play a
              round.
            </p>
          </>
        )}
        <div aria-live="polite">
          {lines.map((line, i) => (
            <Line key={i} line={line} />
          ))}
        </div>
        <form onSubmit={submit} className="flex items-baseline">
          <label htmlFor="terminal-input" className="sr-only">
            Terminal command
          </label>
          {/* A margin, not a space: flex layout would collapse the space. */}
          <span
            aria-hidden="true"
            className="text-terminal-muted mr-[1ch] select-none"
          >
            $
          </span>
          <span className="relative flex min-w-0 flex-1 text-base sm:text-[0.75rem]">
            <input
              ref={inputRef}
              id="terminal-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              className="caret-terminal-key min-w-0 flex-1 bg-transparent outline-none"
            />
            {/* Until someone clicks in, a blinking block cursor hints that the
                terminal takes input. The real caret takes over on focus. */}
            {!focused && !input && (
              <span
                aria-hidden="true"
                data-terminal-cursor
                className="bg-terminal-key animate-blink pointer-events-none absolute top-1/2 left-0 h-[1.15em] w-[0.6em] -translate-y-1/2 motion-reduce:animate-none"
              />
            )}
          </span>
        </form>
      </div>
      {golfOpen && (
        <Suspense fallback={null}>
          <GolfGame
            onClose={() => {
              setGolfOpen(false);
              inputRef.current?.focus();
            }}
          />
        </Suspense>
      )}
    </figure>
  );
}
