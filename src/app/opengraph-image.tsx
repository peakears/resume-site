import { ImageResponse } from "next/og";
import { profile } from "@/data/profile";

// Required with `output: "export"`: generate this file once at build time.
export const dynamic = "force-static";

// The card shown when the site link is shared on LinkedIn, Slack, etc.
export const alt = `${profile.name}, ${profile.title}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Mirrors the dark theme tokens in globals.css.
const colors = {
  background: "#0a0f0c",
  surface: "#12201a",
  foreground: "#ecf3ee",
  muted: "#a3b1a8",
  accent: "#4ade80",
};

export default function Image() {
  const domain = new URL(profile.siteUrl).host;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        background: `linear-gradient(160deg, ${colors.background} 55%, ${colors.surface} 100%)`,
        color: colors.foreground,
      }}
    >
      <div style={{ display: "flex", fontSize: 30, color: colors.accent }}>
        {"<"}
        {domain}
        {" />"}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: -2 }}>
          {profile.name}
        </div>
        <div style={{ fontSize: 44, color: colors.muted, marginTop: 12 }}>
          {profile.title}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          fontSize: 28,
          color: colors.muted,
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            background: colors.accent,
            marginRight: 16,
          }}
        />
        {profile.location}
      </div>
    </div>,
    size,
  );
}
