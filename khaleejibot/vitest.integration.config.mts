import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// Run via `npm run test:integration` (needs Postgres + PostgREST; see scripts/test-integration.sh).
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./tests/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    include: ["tests/integration/**/*.int.test.ts"],
    environment: "node",
    // Tests share one database; run files sequentially.
    fileParallelism: false,
  },
});
