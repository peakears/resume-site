import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { profile } from "@/data/profile";

// Required with `output: "export"`: generate this file once at build time.
export const dynamic = "force-static";

// The card shown when the site link is shared on LinkedIn, Slack, etc.
export const alt = `${profile.name}, ${profile.title}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Mirrors the dark theme tokens in globals.css (the image can't read CSS).
const colors = {
  background: "#0a0f0c",
  surface: "#12201a",
  foreground: "#ecf3ee",
  muted: "#a3b1a8",
  accent: "#4ade80",
  border: "#23352b",
  terminal: "#0f1914",
  key: "#86efac",
  string: "#fde68a",
};

/** The headshot as a data URL, read from `public/` at build time. */
async function loadHeadshot(): Promise<string | null> {
  if (!profile.headshot) return null;
  const file = await readFile(
    join(process.cwd(), "public", profile.headshot.src),
  );
  const type = profile.headshot.src.endsWith(".png") ? "png" : "jpeg";
  return `data:image/${type};base64,${file.toString("base64")}`;
}

export default async function Image() {
  const domain = new URL(profile.siteUrl).host;
  const headshot = await loadHeadshot();
  const quoted = (items: string[]) =>
    items.map((item) => `"${item}"`).join(", ");

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: `linear-gradient(160deg, ${colors.background} 55%, ${colors.surface} 100%)`,
        color: colors.foreground,
      }}
    >
      <div style={{ display: "flex", fontSize: 30, color: colors.accent }}>
        {"<"}
        {domain}
        {" />"}
      </div>

      <div style={{ display: "flex", alignItems: "center" }}>
        {headshot && (
          <img
            src={headshot}
            alt=""
            width={220}
            height={220}
            style={{
              borderRadius: 110,
              border: `6px solid ${colors.accent}`,
              marginRight: 48,
            }}
          />
        )}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 88, fontWeight: 700, letterSpacing: -2 }}>
            {profile.name}
          </div>
          <div style={{ fontSize: 34, color: colors.muted, marginTop: 10 }}>
            {`${profile.title} · ${profile.location}`}
          </div>
        </div>
      </div>

      {/* A one-line nod to the terminal in the hero. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          alignSelf: "flex-start",
          padding: "18px 28px",
          borderRadius: 16,
          border: `2px solid ${colors.border}`,
          background: colors.terminal,
          fontFamily: "monospace",
          fontSize: 28,
          color: colors.muted,
        }}
      >
        <span style={{ color: colors.key }}>stack</span>
        <span>: [</span>
        <span style={{ color: colors.string }}>
          {quoted(profile.coreStack)}
        </span>
        <span>]</span>
        <span style={{ marginLeft: 32, color: colors.accent }}>$ golf</span>
      </div>
    </div>,
    size,
  );
}
