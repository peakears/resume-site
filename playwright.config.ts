import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;
/** The hub page for the apex domain, built from the same profile data. */
const HUB_PORT = 4175;

/**
 * E2E/integration tests run against the real static build in `out/`,
 * served exactly as a static host would serve it.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // In CI: inline annotations on the PR, plus an HTML report uploaded on failure.
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "desktop",
      testIgnore: /hub\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      testIgnore: /hub\.spec\.ts/,
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "hub-desktop",
      testMatch: /hub\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: `http://localhost:${HUB_PORT}`,
      },
    },
    {
      name: "hub-mobile",
      testMatch: /hub\.spec\.ts/,
      use: { ...devices["Pixel 7"], baseURL: `http://localhost:${HUB_PORT}` },
    },
  ],
  webServer: [
    {
      command: `npm run build && npx serve out -l ${PORT} --no-port-switching`,
      url: `http://localhost:${PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: `npm run hub:build && npx serve hub/dist -l ${HUB_PORT} --no-port-switching`,
      url: `http://localhost:${HUB_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
