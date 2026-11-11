import { describe, expect, it } from "vitest";
import { basePathOf, prefixHeaders, withBasePath } from "@/lib/basePath";
import { profile } from "@/data/profile";

describe("basePathOf", () => {
  it("returns the path of the site URL without a trailing slash", () => {
    expect(basePathOf("https://example.dev/resume")).toBe("/resume");
    expect(basePathOf("https://example.dev/resume/")).toBe("/resume");
  });

  it("is empty when the site is at the root of its domain", () => {
    expect(basePathOf("https://example.dev")).toBe("");
    expect(basePathOf("https://example.dev/")).toBe("");
  });

  it("serves the real site at /resume", () => {
    expect(basePathOf(profile.siteUrl)).toBe("/resume");
  });
});

describe("withBasePath", () => {
  it("prefixes root-relative paths", () => {
    expect(withBasePath("https://example.dev/resume", "/resume.pdf")).toBe(
      "/resume/resume.pdf",
    );
    expect(withBasePath("https://example.dev", "/resume.pdf")).toBe(
      "/resume.pdf",
    );
  });

  it("rejects paths that aren't root-relative", () => {
    expect(() => withBasePath("https://example.dev/resume", "x.pdf")).toThrow(
      /root-relative/,
    );
  });
});

describe("prefixHeaders", () => {
  it("prefixes URL patterns and leaves comments and headers alone", () => {
    const headers = [
      "# Comment about /paths",
      "",
      "/*",
      "  X-Frame-Options: DENY",
      "",
      "/opengraph-image",
      "  Content-Type: image/png",
    ].join("\n");

    expect(prefixHeaders(headers, "/resume")).toBe(
      [
        "# Comment about /paths",
        "",
        "/resume/*",
        "  X-Frame-Options: DENY",
        "",
        "/resume/opengraph-image",
        "  Content-Type: image/png",
      ].join("\n"),
    );
  });
});
