import type { GlobalConfig } from "payload";
import { Homepage } from "@/payload/globals/homepage";
import { SiteAnnouncement } from "@/payload/globals/site-announcement";
import { ModerationSettings } from "@/payload/globals/moderation-settings";
import { HubIllustrations } from "@/payload/globals/hub-illustrations";
import { EventSuggestions } from "@/payload/globals/event-suggestions";
import {
  ONBOARDING_GLOBALS,
  OnboardingBasicInfo,
  OnboardingPrivacy,
  OnboardingRecentWork,
  OnboardingReview,
  OnboardingContent,
  OnboardingWorkInfo,
} from "@/payload/globals/onboarding-content";

export {
  Homepage,
  SiteAnnouncement,
  ModerationSettings,
  HubIllustrations,
  EventSuggestions,
  ONBOARDING_GLOBALS,
  OnboardingContent,
  OnboardingBasicInfo,
  OnboardingWorkInfo,
  OnboardingRecentWork,
  OnboardingPrivacy,
  OnboardingReview,
};

/**
 * The five singletons of the plan's "What is being imported" table:
 * `homepage`, `onboardingContent`, `siteAnnouncement`, `moderationSettings`,
 * `hubIllustrations` — nine Payload globals, because `onboardingContent`'s
 * copy is stored as six (payload/globals/onboarding-content.ts: 194 localized
 * varchar columns against Postgres's 100-argument function limit, so it is
 * split by onboarding step and composed back on read).
 *
 * `siteAnnouncement` appears in spec §6's list of 19 live *collections*, but
 * its own Sanity schema header calls it "a SINGLETON", production_2 holds
 * exactly one document with the fixed `_id: "siteAnnouncement"`, and the
 * plan's table lists it under Globals. It is a global.
 *
 * Three of the five (`moderationSettings` 0 docs, `hubIllustrations` 0 docs,
 * and the never-authored halves of the others) import nothing — they exist
 * because live code reads them (spec §6, "Keep").
 */
export const globals: GlobalConfig[] = [
  // Site pages
  Homepage,
  SiteAnnouncement,
  HubIllustrations,
  // Onboarding (its own nav group; globals-only groups list after collection groups)
  ...ONBOARDING_GLOBALS,
  // System
  ModerationSettings,
  EventSuggestions,
];
