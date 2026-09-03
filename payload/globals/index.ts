import type { GlobalConfig } from "payload";
import { Homepage } from "@/payload/globals/homepage";
import { SiteAnnouncement } from "@/payload/globals/site-announcement";
import { ModerationSettings } from "@/payload/globals/moderation-settings";
import { HubIllustrations } from "@/payload/globals/hub-illustrations";
import { OnboardingContent } from "@/payload/globals/onboarding-content";

export { Homepage, SiteAnnouncement, ModerationSettings, HubIllustrations, OnboardingContent };

/**
 * The five singletons, per the plan's "What is being imported" table:
 * `homepage`, `onboardingContent`, `siteAnnouncement`, `moderationSettings`,
 * `hubIllustrations`.
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
  Homepage,
  SiteAnnouncement,
  ModerationSettings,
  HubIllustrations,
  OnboardingContent,
];
