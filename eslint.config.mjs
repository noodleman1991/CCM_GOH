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
      // .claude/ holds agent worktrees — full repo copies with their own
      // node_modules, which `node_modules/**` (top-level only) does not cover.
      // Without this, `eslint .` parses ~54k extra files and dies with a V8
      // heap OOM. Mirrors the same exclude in vitest.config.ts.
      ".claude/**",
      "**/node_modules/**",
      ".playwright-mcp/**",
      "public/**",
      "scripts/**",
      "**/*.config.{js,mjs,ts}",
    ],
  },
  {
    // Text guard (polish standard §2): user-visible text never hand-truncates —
    // clamping is line-clamp's job, with the full string in title/aria and on
    // the detail page. Warn (not error) while the i18n sweep retires the
    // existing "Loading..."-style literals; new code should not add any.
    files: ["components/**/*.tsx", "app/**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector: "JSXText[value=/\\.\\.\\.|\\u2026/]",
          message:
            "No literal ellipsis in JSX — clamp with line-clamp (full text in title/aria) or use an i18n string without '…'.",
        },
      ],
    },
  },
];
