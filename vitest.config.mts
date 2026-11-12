import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}", "api/src/**/*.ts"],
      exclude: ["src/app/layout.tsx"],
    },
    projects: [
      {
        // The site: components and libraries, tested in a simulated browser.
        plugins: [tsconfigPaths(), react()],
        test: {
          name: "site",
          environment: "jsdom",
          setupFiles: ["./tests/setup.ts"],
          include: ["tests/unit/**/*.test.{ts,tsx}"],
        },
      },
      {
        // The API Worker: no browser, so no DOM and no browser test setup.
        test: {
          name: "api",
          environment: "node",
          include: ["api/tests/**/*.test.ts"],
        },
      },
    ],
  },
});
