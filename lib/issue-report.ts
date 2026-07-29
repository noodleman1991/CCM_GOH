import { z } from "zod";

/**
 * Shared core for the editor-only "Report a problem" widget. Pure — no server
 * deps — so both the client form and the route handler import the same schema
 * and the helpers stay unit-testable.
 *
 * Urgency and area travel as plain strings rather than enums: the vocabularies
 * are UI concerns that editors will want to reword, and nothing downstream
 * (email only — no persistence) needs them to be a closed set.
 */

export const URGENCY_VALUES = ["blocking", "annoying", "minor", "idea"] as const;

/**
 * Areas of the hub, in editor language. `other` is the fallback whenever the
 * path doesn't match anything known — never guess.
 */
export const AREA_VALUES = [
  "home",
  "map",
  "stories",
  "story-submit",
  "case-studies",
  "research-outputs",
  "communities",
  "collaborations",
  "events",
  "news",
  "blog",
  "reader",
  "search",
  "profiles",
  "dashboard",
  "messages",
  "comments",
  "notifications",
  "auth",
  "onboarding",
  "studio",
  "navigation",
  "whole-site",
  "other",
] as const;

/** Screenshots ride along as an email attachment, so keep them modest. */
export const MAX_SCREENSHOT_BYTES = 4 * 1024 * 1024;
/** base64 inflates by ~4/3; allow headroom over MAX_SCREENSHOT_BYTES. */
const MAX_SCREENSHOT_BASE64 = Math.ceil((MAX_SCREENSHOT_BYTES * 4) / 3) + 1024;

export const ACCEPTED_SCREENSHOT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;

/** Locale prefixes the hub routes under; stripped before matching an area. */
const LOCALE_PREFIX = /^\/(en|es|fr|ar)(?=\/|$)/;

/** First match wins, so put the more specific paths above their parents. */
const AREA_BY_PATH: ReadonlyArray<readonly [RegExp, string]> = [
  [/^\/atlas/, "map"],
  [/^\/lived-experiences\/submit/, "story-submit"],
  [/^\/lived-experiences/, "stories"],
  [/^\/research-and-action\/case-studies/, "case-studies"],
  [/^\/research-and-action\/research-outputs/, "research-outputs"],
  [/^\/research-and-action/, "case-studies"],
  [/^\/communities/, "communities"],
  [/^\/collaborations/, "collaborations"],
  [/^\/collaborate\/events/, "events"],
  [/^\/collaborate/, "collaborations"],
  [/^\/news/, "news"],
  [/^\/blog/, "blog"],
  [/^\/reader/, "reader"],
  [/^\/search/, "search"],
  [/^\/profiles/, "profiles"],
  [/^\/dashboard/, "dashboard"],
  [/^\/messages/, "messages"],
  [/^\/moderation/, "comments"],
  [/^\/notifications/, "notifications"],
  [/^\/(sign-in|sign-up)/, "auth"],
  [/^\/onboarding/, "onboarding"],
  [/^\/studio/, "studio"],
];

/**
 * Best guess at which part of the hub a path belongs to, used to pre-select the
 * area so the reporter usually doesn't have to touch it. Always overridable.
 */
export function deriveAreaFromPath(pathname: string): string {
  if (!pathname) return "other";
  const path = pathname.replace(LOCALE_PREFIX, "") || "/";
  if (path === "/" || path === "") return "home";
  for (const [pattern, area] of AREA_BY_PATH) {
    if (pattern.test(path)) return area;
  }
  return "other";
}

/** Browser name + major version from a UA string. "Unknown" when unrecognised. */
export function describeBrowser(userAgent: string): string {
  const ua = userAgent || "";
  // Order matters: Edge/Opera/Brave all carry "Chrome", and Chrome carries "Safari".
  const checks: ReadonlyArray<readonly [string, RegExp]> = [
    ["Edge", /Edg(?:e|A|iOS)?\/(\d+)/],
    ["Opera", /(?:OPR|Opera)\/(\d+)/],
    ["Samsung Internet", /SamsungBrowser\/(\d+)/],
    ["Firefox", /(?:Firefox|FxiOS)\/(\d+)/],
    ["Chrome", /(?:Chrome|CriOS)\/(\d+)/],
    ["Safari", /Version\/(\d+).*Safari/],
  ];
  for (const [name, pattern] of checks) {
    const match = ua.match(pattern);
    if (match) return `${name} ${match[1]}`;
  }
  return "Unknown browser";
}

/** Coarse device class. Viewport width breaks the tablet/phone tie on iPadOS. */
export function describeDevice(userAgent: string, viewportWidth?: number): string {
  const ua = userAgent || "";
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return "Tablet";
  if (/Mobi|iPhone|Android.*Mobile|Windows Phone/i.test(ua)) return "Phone";
  if (/Android/i.test(ua)) return "Tablet";
  // iPadOS 13+ reports a desktop Mac UA; a touch-sized viewport gives it away.
  if (typeof viewportWidth === "number" && viewportWidth > 0 && viewportWidth < 768) {
    return "Phone";
  }
  return "Computer";
}

/** Operating system, for the "so which machine was this?" question. */
export function describeOs(userAgent: string): string {
  const ua = userAgent || "";
  if (/Windows NT/i.test(ua)) return "Windows";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Mac OS X|Macintosh/i.test(ua)) return "macOS";
  if (/Android/i.test(ua)) return "Android";
  if (/Linux/i.test(ua)) return "Linux";
  return "Unknown";
}

export const issueReportSchema = z.object({
  summary: z.string().trim().min(3, "Too short").max(200),
  whatHappened: z.string().trim().min(3, "Too short").max(5000),
  whatShouldHappen: z.string().trim().max(5000).default(""),
  urgency: z.string().trim().min(1).max(40),
  area: z.string().trim().min(1).max(60),
  wasSignedIn: z.boolean(),
  context: z.object({
    url: z.string().trim().max(2000).default(""),
    pageTitle: z.string().trim().max(300).default(""),
    locale: z.string().trim().max(10).default(""),
    browser: z.string().trim().max(120).default(""),
    device: z.string().trim().max(120).default(""),
    os: z.string().trim().max(60).default(""),
    viewport: z.string().trim().max(40).default(""),
    userAgent: z.string().trim().max(500).default(""),
  }),
  screenshot: z
    .object({
      filename: z.string().trim().max(200),
      contentType: z.string().trim().max(100),
      dataBase64: z.string().max(MAX_SCREENSHOT_BASE64),
    })
    .nullish(),
});

export type IssueReportInput = z.infer<typeof issueReportSchema>;
