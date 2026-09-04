import { fileURLToPath } from "node:url";
import { defineConfig, defaultExclude } from "vitest/config";

export default defineConfig({
  test: {
    // Tests are node-environment by default (the suite is lib-heavy; no jsdom).
    environment: "node",
    // .claude/ holds agent worktrees (full repo copies incl. their own
    // node_modules); without this exclude `vitest run` sweeps thousands of
    // dependency test files. generated/ and scripts/ are excluded likewise.
    exclude: [...defaultExclude, "**/.claude/**", "generated/**", "scripts/**"],
    // `payload.config.ts` resolves the R2 bucket eagerly and throws when none
    // is configured, so that a deployment missing the variable fails at boot
    // instead of writing 618 MB somewhere nobody chose
    // (payload/storage/r2.ts). Vitest loads no .env file, so the ~14 test
    // files that import the config need a value here. Deliberately not a real
    // bucket name: nothing under test performs an upload, and a fake name
    // makes that obvious if one ever tries.
    env: { R2_BUCKET: "vitest-no-such-bucket" },
  },
  resolve: {
    // Mirrors tsconfig `"@/*": ["./*"]` (a config file suppresses Vitest's
    // automatic tsconfig-paths resolution).
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)).replace(/\/$/, ""),
      // Mirrors tsconfig `"@payload-config": ["./payload.config.ts"]`.
      "@payload-config": fileURLToPath(new URL("./payload.config.ts", import.meta.url)),
      // `server-only` ships only a react-server export; stub it under vitest.
      "server-only": fileURLToPath(new URL("./lib/__tests__/stubs/server-only.ts", import.meta.url)),
    },
  },
});
