import next from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Flat ESLint config (ESLint 9 / Next 16). Replaces the deprecated `next lint`
 * path. Run with `pnpm exec eslint .`.
 */
export default [
  ...(Array.isArray(next) ? next : [next]),
  ...(Array.isArray(nextTs) ? nextTs : [nextTs]),
  {
    ignores: [
      ".next/**",
      "generated/**",
      "node_modules/**",
      ".playwright-mcp/**",
      "public/**",
      "scripts/**",
      "**/*.config.{js,mjs,ts}",
    ],
  },
];
