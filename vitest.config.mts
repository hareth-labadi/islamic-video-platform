import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Unit and component tests (see node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md).
// `npm test` runs once; `npm run test:watch` re-runs on save.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
    // Screen tests render the whole panel in jsdom; give them room on a busy machine.
    testTimeout: 15_000,
  },
});
