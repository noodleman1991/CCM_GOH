/**
 * Feature flags for the intermediate production release.
 *
 * The engagement program (direct messages, notifications, collaboration
 * workspaces) is fully built and its INFRASTRUCTURE stays in place (DB
 * models, services, API routes, schemas). The flag only gates the
 * user-facing UI so production can ship clean while the features finish.
 * Re-enable by setting the env var to "true" — no code change needed.
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
} as const;

export type FeatureName = keyof typeof FEATURES;
