import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { profile } from "../../src/data/profile";

test.describe("home page", () => {
  test("loads with the profile content and no console errors", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on(
      "console",
      (msg) => msg.type() === "error" && errors.push(msg.text()),
    );
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");

    await expect(page).toHaveTitle(new RegExp(profile.name));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      profile.name,
    );
    for (const section of [
      "About",
      "Experience",
      "Education",
      "Skills",
      "Projects",
      "Contact",
    ]) {
      await expect(
        page.getByRole("heading", { level: 2, name: section }),
      ).toBeVisible();
    }
    expect(errors).toEqual([]);
  });

  test("navigation links jump to their sections", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "Section nav is hidden on small screens");
    await page.goto("/");

    await page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "Projects" })
      .click();

    await expect(page).toHaveURL(/#projects$/);
    await expect(
      page.getByRole("heading", { level: 2, name: "Projects" }),
    ).toBeInViewport();
  });

  test("serves the PDF resume linked from the page", async ({
    page,
    request,
  }) => {
    await page.goto("/");
    const href = await page
      .getByRole("link", { name: "Download resume (PDF)" })
      .first()
      .getAttribute("href");
    expect(href).toBe(profile.resumePdf);

    const response = await request.get(href!);
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toContain("application/pdf");
    expect((await response.body()).subarray(0, 5).toString()).toBe("%PDF-");
  });

  test("alternates section backgrounds on desktop only", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/");
    const background = (id: string) =>
      page
        .locator(`section#${id}`)
        .evaluate((el) => getComputedStyle(el).backgroundColor);

    const about = await background("about");
    const experience = await background("experience");
    if (isMobile) {
      expect(about).toBe(experience);
    } else {
      expect(about).not.toBe(experience);
    }
  });

  test("theme choice persists across reloads", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    const html = page.locator("html");
    await expect(html).not.toHaveClass(/dark/);

    await page.getByRole("button", { name: "Switch to dark theme" }).click();
    await expect(html).toHaveClass(/dark/);

    await page.reload();
    await expect(html).toHaveClass(/dark/);
  });

  test("follows the OS colour scheme on first visit", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveClass(/dark/);
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

  test("contact buttons are the same height and line up", async ({ page }) => {
    await page.goto("/");
    const boxes = await page.locator("#contact ul a").evaluateAll((links) =>
      links.map((a) => {
        const r = a.getBoundingClientRect();
        return { top: Math.round(r.top), height: Math.round(r.height) };
      }),
    );
    expect(boxes.length).toBeGreaterThan(1);

    // Every button has the same height...
    expect(new Set(boxes.map((b) => b.height)).size).toBe(1);
    // ...and buttons on the same row share the same top edge.
    const rows = new Map<number, number[]>();
    for (const { top } of boxes) {
      const row = [...rows.keys()].find((t) => Math.abs(t - top) < 20) ?? top;
      rows.set(row, [...(rows.get(row) ?? []), top]);
    }
    for (const tops of rows.values()) {
      expect(new Set(tops).size).toBe(1);
    }
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

  test("shows featured skills and reveals the rest on request", async ({
    page,
  }) => {
    await page.goto("/");
    const featured = profile.skills.filter((group) => group.featured);
    const others = profile.skills.filter((group) => !group.featured);
    const list = (category: string) =>
      page.getByRole("list", { name: `${category} skills` });

    await expect(list(featured[0].category)).toBeVisible();
    await expect(list(others[0].category)).toBeHidden();

    await page.getByRole("button", { name: /Show all skills/ }).click();
    for (const group of others) {
      await expect(list(group.category)).toBeVisible();
    }

    await page.getByRole("button", { name: "Show fewer skills" }).click();
    await expect(list(others[0].category)).toBeHidden();
  });

  test("shows the profile terminal in the hero", async ({ page }) => {
    await page.goto("/");
    const terminal = page.getByRole("figure", {
      name: "Profile summary, written as code",
    });
    await expect(terminal).toBeVisible();
    await expect(terminal).toContainText(`role: "${profile.title}"`);
  });

  test("prints every skill group but not the terminal", async ({ page }) => {
    await page.goto("/");
    await page.emulateMedia({ media: "print" });
    for (const group of profile.skills) {
      await expect(
        page.getByRole("list", { name: `${group.category} skills` }),
      ).toBeVisible();
    }
    await expect(page.getByRole("figure")).toBeHidden();
    await expect(page.getByRole("button", { name: /skills/ })).toBeHidden();
  });

  test("loads the headshot in the hero", async ({ page }) => {
    test.skip(!profile.headshot, "No headshot configured");
    await page.goto("/");
    const image = page.getByRole("img", { name: profile.headshot!.alt });
    await expect(image).toBeVisible();
    expect(
      await image.evaluate((img: HTMLImageElement) => img.naturalWidth),
    ).toBeGreaterThan(0);
  });

  test("runs commands in the hero terminal", async ({ page }) => {
    await page.goto("/");
    const prompt = page.getByRole("textbox", { name: "Terminal command" });
    await prompt.fill("about");
    await prompt.press("Enter");
    const terminal = page.getByRole("figure", {
      name: "Profile summary, written as code",
    });
    await expect(terminal).toContainText(profile.aboutHeadline);
  });

  test("plays mini golf from the terminal", async ({ page }) => {
    await page.goto("/");
    const prompt = page.getByRole("textbox", { name: "Terminal command" });
    await prompt.fill("golf");
    await prompt.press("Enter");

    const game = page.getByRole("dialog", { name: "Mini golf" });
    await expect(game).toBeVisible();
    await expect(game).toContainText("Hole 1 of 3");

    const green = game.getByRole("application", { name: "Putting green" });
    await expect(green).toBeVisible();
    const box = await green.boundingBox();
    expect(box!.width).toBeGreaterThan(200);

    // A gentle keyboard putt counts a stroke.
    await green.focus();
    await page.keyboard.press(" ");
    await expect(game).toContainText("Strokes 1");

    const results = await new AxeBuilder({ page }).include("dialog").analyze();
    expect(results.violations).toEqual([]);

    await page.keyboard.press("Escape");
    await expect(game).toBeHidden();
    await expect(prompt).toBeFocused();
  });

  test("holes the first putt with the right line and power", async ({
    page,
  }) => {
    await page.goto("/");
    const prompt = page.getByRole("textbox", { name: "Terminal command" });
    await prompt.fill("golf");
    await prompt.press("Enter");
    const game = page.getByRole("dialog", { name: "Mini golf" });
    const green = game.getByRole("application", { name: "Putting green" });
    await green.focus();

    // The tee is lined up with the hole; 65% power drops it (see golf.test).
    for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowUp");
    await expect(game).toContainText("Power 65%");
    await page.keyboard.press(" ");

    await expect(game).toContainText("Hole in one!");
    await game.getByRole("button", { name: "Next hole" }).click();
    await expect(game).toContainText("Hole 2 of 3");
    await expect(game.getByRole("table", { name: "Scorecard" })).toBeVisible();
  });

  test("reveals content as it scrolls into view", async ({ page }) => {
    await page.goto("/");
    const roles = page.locator("#experience li.reveal");
    await expect(roles.first()).toHaveCSS("animation-name", "reveal");

    // The last role starts below the fold, faded out...
    const last = roles.last();
    await expect(last).toHaveCSS("opacity", "0");
    // ...and is fully visible once scrolled into view.
    await last.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await expect(last).toHaveCSS("opacity", "1");
  });

  test("skips the reveal for reduced motion and in print", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const last = page.locator("#experience li.reveal").last();
    await expect(last).toHaveCSS("animation-name", "none");
    await expect(last).toHaveCSS("opacity", "1");

    await page.emulateMedia({ reducedMotion: "no-preference", media: "print" });
    await expect(last).toHaveCSS("animation-name", "none");
  });
});
