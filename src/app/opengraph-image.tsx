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

/** Geist from the `geist` package, so text renders in the site's font. */
const font = (path: string) =>
  readFile(join(process.cwd(), "node_modules", "geist", "dist", "fonts", path));

export default async function Image() {
  const domain = new URL(profile.siteUrl).host;
  const headshot = await loadHeadshot();
  const [regular, bold, mono] = await Promise.all([
    font("geist-sans/Geist-Regular.ttf"),
    font("geist-sans/Geist-Bold.ttf"),
    font("geist-mono/GeistMono-Medium.ttf"),
  ]);

  // LinkedIn and Slack show this card at roughly half size and re-compress
  // it, so it uses a few large, high-contrast elements and no small text.
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        padding: "0 80px",
        background: `linear-gradient(160deg, ${colors.background} 55%, ${colors.surface} 100%)`,
        color: colors.foreground,
        fontFamily: "Geist",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <div
          style={{
            fontFamily: "Geist Mono",
            fontSize: 30,
            color: colors.accent,
          }}
        >
          {domain}
        </div>
        <div
          style={{
            fontSize: 92,
            fontWeight: 700,
            letterSpacing: -3,
            lineHeight: 1.05,
            marginTop: 20,
          }}
        >
          {profile.name}
        </div>
        <div style={{ fontSize: 46, marginTop: 14 }}>{profile.title}</div>
        <div
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: colors.accent,
            marginTop: 36,
          }}
        >
          {profile.coreStack.join(" · ")}
        </div>
      </div>
      {headshot && (
        <img
          src={headshot}
          alt=""
          width={300}
          height={300}
          style={{
            borderRadius: 150,
            border: `8px solid ${colors.accent}`,
            marginLeft: 56,
          }}
        />
      )}
    </div>,
    {
      ...size,
      fonts: [
        { name: "Geist", data: regular, weight: 400, style: "normal" },
        { name: "Geist", data: bold, weight: 700, style: "normal" },
        { name: "Geist Mono", data: mono, weight: 500, style: "normal" },
      ],
    },
  );
}
