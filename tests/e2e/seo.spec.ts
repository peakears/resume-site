import { expect, test } from "@playwright/test";
import { profile } from "../../src/data/profile";

test.describe("search and link previews", () => {
  test("declares the canonical URL and Open Graph metadata", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      profile.siteUrl,
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      new RegExp(profile.name),
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );
  });

  test("serves a 1200x630 PNG preview image", async ({ page, request }) => {
    await page.goto("/");
    const imageUrl = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content");
    expect(imageUrl).toMatch(new RegExp(`^${profile.siteUrl}/`));

    // The meta tag holds the production URL; fetch the same path locally.
    const { pathname, search } = new URL(imageUrl!);
    const response = await request.get(pathname + search);
    expect(response.ok()).toBe(true);
    const body = await response.body();
    // PNG signature, then width and height from the IHDR chunk.
    expect(body.subarray(1, 4).toString()).toBe("PNG");
    expect(body.readUInt32BE(16)).toBe(1200);
    expect(body.readUInt32BE(20)).toBe(630);
  });

  test("serves robots.txt pointing at the sitemap", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.ok()).toBe(true);
    const text = await response.text();
    expect(text).toContain("Allow: /");
    expect(text).toContain(`Sitemap: ${profile.siteUrl}/sitemap.xml`);
  });

  test("serves a sitemap listing the home page", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.ok()).toBe(true);
    expect(await response.text()).toContain(`<loc>${profile.siteUrl}/</loc>`);
  });

  test("describes the person with JSON-LD structured data", async ({
    page,
  }) => {
    await page.goto("/");
    const scripts = page.locator('script[type="application/ld+json"]');
    await expect(scripts).toHaveCount(1);

    const jsonLd = JSON.parse((await scripts.textContent())!);
    expect(jsonLd["@type"]).toBe("ProfilePage");
    expect(jsonLd.mainEntity).toMatchObject({
      "@type": "Person",
      name: profile.name,
      jobTitle: profile.title,
      url: `${profile.siteUrl}/`,
      sameAs: profile.socials.map((social) => social.href),
    });

    const current = profile.experience.find((role) => role.end === null);
    expect(jsonLd.mainEntity.worksFor).toContainEqual({
      "@type": "Organization",
      name: current!.company,
    });
  });
});
