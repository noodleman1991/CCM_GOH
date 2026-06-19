/**
 * Feature flags for the intermediate production release.
 *
 * The engagement program (direct messages, notifications, collaboration
 * workspaces) and the homepage interactive map are fully built and their
 * INFRASTRUCTURE stays in place (DB models, services, API routes, schemas).
 * These flags only gate the user-facing UI so production can ship clean while
 * the features finish. Re-enable by setting the env var to "true" — no code
 * change needed.
 *
 * Default = OFF (hidden) unless explicitly enabled, so production is safe by
 * default and a forgotten env var can never accidentally expose unfinished UI.
 *
 * Note: NEXT_PUBLIC_* so the flags are readable in both server and client
 * components (they gate UI, not secrets).
 */

const on = (v: string | undefined) => v === "true" || v === "1";

export const FEATURES = {
  /**
   * Direct messages, notifications, and collaboration workspaces UI.
   * Hides: sidebar "Workspaces", avatar Messages/Notifications, the header
   * notification bell, and the collaborate-page "Start a workspace" CTA.
   * Routes (/messages, /collaborations, /moderation) still exist server-side.
   */
  engagement: on(process.env.NEXT_PUBLIC_FEATURE_ENGAGEMENT),

  /** The interactive region map block on the homepage. */
  homepageMap: on(process.env.NEXT_PUBLIC_FEATURE_HOMEPAGE_MAP),
} as const;

export type FeatureName = keyof typeof FEATURES;
