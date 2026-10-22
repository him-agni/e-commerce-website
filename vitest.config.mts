import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      // `server-only` throws outside Next's server build, so tests get an empty stand-in.
      { find: /^server-only$/, replacement: root("./tests/helpers/server-only.ts") },
      { find: /^@\//, replacement: root("./") + "/" },
    ],
  },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    environment: "node",
    setupFiles: ["./tests/helpers/setup.ts"],
    restoreMocks: true,
    coverage: {
      provider: "v8",
      include: ["lib/**", "app/api/**", "components/assistant/message-content.tsx"],
      exclude: ["lib/use-hydrated.ts", "lib/site.ts"],
      reporter: ["text", "html"],
    },
  },
});
