import { fileURLToPath } from "node:url";
import { defineConfig, defaultExclude } from "vitest/config";

export default defineConfig({
  test: {
    // .claude/ holds agent worktrees (full repo copies incl. their own
    // node_modules); without this exclude `vitest run` sweeps thousands of
    // dependency test files.
    exclude: [...defaultExclude, "**/.claude/**"],
  },
  resolve: {
    // Mirrors tsconfig `"@/*": ["./*"]` (a config file suppresses Vitest's
    // automatic tsconfig-paths resolution).
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)).replace(/\/$/, ""),
      // `server-only` ships only a react-server export; stub it under vitest.
      "server-only": fileURLToPath(new URL("./lib/__tests__/stubs/server-only.ts", import.meta.url)),
    },
  },
});
