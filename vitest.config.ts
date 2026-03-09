import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";

export default defineConfig({
  plugins: [svelte({ hot: false })],
  resolve: {
    conditions: ["browser"],
    alias: {
      "@ipms/shared": path.resolve(__dirname, "packages/shared/src/index.ts"),
      "@ipms/domain": path.resolve(__dirname, "packages/domain/src/index.ts"),
      "@ipms/application": path.resolve(__dirname, "packages/application/src/index.ts"),
      "@ipms/infrastructure": path.resolve(__dirname, "packages/infrastructure/src/index.ts"),
      "@ipms/state-machines": path.resolve(__dirname, "packages/state-machines/src/index.ts"),
    },
  },
  test: {
    globals: true,
    include: ["packages/*/src/**/*.test.ts"],
    environment: "jsdom",
    setupFiles: ["@testing-library/svelte/vitest"],
  },
});
