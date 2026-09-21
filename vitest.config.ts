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
    // Same reasoning for Sanity: `sanity/env.ts` asserts dataset and project
    // id at import, so a test that imports the real `sanity/lib/client` (to
    // check how it is *configured*, rather than to mock it away) cannot load
    // without them. Deliberately fake — nothing under test issues a request,
    // and a fake project id makes that obvious if one ever tries.
    env: {
      R2_BUCKET: "vitest-no-such-bucket",
      // Uploads are served through Payload's handler in the suite; a developer's
      // .env may set the public host, which would drop the handler
      // (payload/storage/public-url.ts) and flip payload-uploads.test.ts.
      NEXT_PUBLIC_PAYLOAD_MEDIA_PUBLIC_URL: "",
      NEXT_PUBLIC_SANITY_DATASET: "vitest-no-such-dataset",
      NEXT_PUBLIC_SANITY_PROJECT_ID: "vitestnosuchproject",
      // The engagement program (workspaces, messages, contact requests,
      // RSVPs) is behind this flag and its server actions refuse when it is
      // off (Slice 6, 2026-09-17). The suites for those actions test the
      // behaviour behind the gate, so the runner's default is ON; the gate
      // itself is covered by engagement-flag-gates.test.ts, which mocks the
      // flag off explicitly.
      NEXT_PUBLIC_FEATURE_ENGAGEMENT: "true",
    },
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
