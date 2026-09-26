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
      // Every Next build output: `.next` and the `.next-parity-*` dist dirs the
      // parity harness sets through NEXT_DIST_DIR (2,600 files that made
      // `eslint .` run past ten minutes, Slice 15).
      ".next*/**",
      "coverage/**",
      ".vercel/**",
      "generated/**",
      "node_modules/**",
      // .claude/ holds agent worktrees — full repo copies with their own
      // node_modules, which `node_modules/**` (top-level only) does not cover.
      // Without this, `eslint .` parses ~54k extra files and dies with a V8
      // heap OOM. Mirrors the same exclude in vitest.config.ts.
      ".claude/**",
      // Static design-spec snapshot (reference artifacts, not app code).
      "design_handoff_ccm_hub/**",
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
      // Every public route lives under /{locale}; next-intl's Link/redirect
      // from @/i18n/navigation carry it. The bare primitives drop it (Slice 10c).
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "next/link", message: "Use { Link } from '@/i18n/navigation' — it carries the locale." },
            { name: "next/navigation", importNames: ["redirect"], message: "Use { redirect } from '@/i18n/navigation' with { href, locale }." },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXText[value=/\\.\\.\\.|\\u2026/]",
          message:
            "No literal ellipsis in JSX — clamp with line-clamp (full text in title/aria) or use an i18n string without '…'.",
        },
        // The document sets `dir`, so the browser mirrors every flex row; a
        // locale-gated flex-row-reverse mirrors it back. Directional arrows
        // are icons with rtl:-scale-x-100, never a literal glyph (Slice 13c).
        {
          selector: "Literal[value=/flex-row-reverse/], TemplateElement[value.raw=/flex-row-reverse/]",
          message:
            "Do not reverse rows for RTL — the document's dir already mirrors flex rows. Use logical utilities (ms-/me-/ps-/pe-/start/end).",
        },
        {
          selector: "Literal[value=/(^|[^:])space-x-reverse/]",
          message: "Use the rtl:space-x-reverse variant, not a locale flag.",
        },
        {
          selector: "JSXText[value=/[→←]/]",
          message: "Draw arrows with an icon and rtl:-scale-x-100 so they flip with the reading direction.",
        },
      ],
    },
  },
];
