import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { themeInitScript } from "@/components/ThemeToggle";
import { profile } from "@/data/profile";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title = `${profile.name} · ${profile.title}`;

export const metadata: Metadata = {
  metadataBase: new URL(profile.siteUrl),
  title,
  description: profile.summary,
  alternates: { canonical: "/" },
  // The preview image comes from app/opengraph-image.tsx automatically.
  openGraph: {
    type: "profile",
    url: "/",
    siteName: profile.name,
    title,
    description: profile.summary,
    locale: "en_CA",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: profile.summary,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the theme script sets the `dark` class before hydration.
    <html
      lang="en"
      id="top"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
