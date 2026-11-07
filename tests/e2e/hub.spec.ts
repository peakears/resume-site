import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { profile } from "../../src/data/profile";

/** The hub page for patrickkearney.dev (see playwright.config.ts). */
test.describe("hub page", () => {
  test("links to the resume, PDF, profiles and email", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(new RegExp(profile.name));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      profile.name,
    );

    const nav = page.getByRole("navigation", { name: "Links" });
    const href = (name: RegExp) =>
      nav.getByRole("link", { name }).getAttribute("href");
    expect(await href(/^Resume/)).toBe(`${profile.siteUrl}/`);
    expect(await href(/^Download resume/)).toBe(
      `${profile.siteUrl}${profile.resumePdf}`,
    );
    for (const social of profile.socials) {
      expect(await href(new RegExp(`^${social.label}`))).toBe(social.href);
    }
    expect(await href(/^Email/)).toBe(`mailto:${profile.email}`);
  });

  test("loads the headshot, stylesheet and favicon", async ({
    page,
    request,
  }) => {
    await page.goto("/");
    const avatar = page.getByRole("img", { name: profile.headshot!.alt });
    await expect(avatar).toBeVisible();
    expect(
      await avatar.evaluate((img: HTMLImageElement) => img.naturalWidth),
    ).toBeGreaterThan(0);
    for (const path of ["/styles.css", "/favicon.svg", "/robots.txt"]) {
      expect((await request.get(path)).ok()).toBe(true);
    }
  });

  test("does not scroll horizontally", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("serves a 404 page that links home", async ({ page }) => {
    const response = await page.goto("/no-such-page");
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("link", { name: `Back to ${profile.name}` }),
    ).toHaveAttribute("href", "/");
  });

  for (const scheme of ["light", "dark"] as const) {
    test(`has no detectable accessibility violations (${scheme})`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/");
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  }
});
