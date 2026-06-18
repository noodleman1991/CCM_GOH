import "server-only";
import { client } from "@/sanity/lib/client";
import { classify, type Tier } from "@/lib/moderation/normalize";

const MODERATION_QUERY = `*[_type == "moderationSettings"][0]{ enabled, blockTerms, reviewTerms }`;

type ModerationSettings = {
  enabled: boolean;
  blockTerms: string[];
  reviewTerms: string[];
};

let cached: { value: ModerationSettings; at: number } | null = null;
const TTL_MS = 60_000;

async function getSettings(): Promise<ModerationSettings> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;
  let value: ModerationSettings = { enabled: true, blockTerms: [], reviewTerms: [] };
  try {
    const raw = await client.fetch<Partial<ModerationSettings> | null>(MODERATION_QUERY);
    if (raw) {
      value = {
        enabled: raw.enabled ?? true,
        blockTerms: Array.isArray(raw.blockTerms) ? raw.blockTerms : [],
        reviewTerms: Array.isArray(raw.reviewTerms) ? raw.reviewTerms : [],
      };
    }
  } catch {
    // keep defaults (filtering effectively off) — fail open for availability,
    // anonymous comments are still held for review regardless.
  }
  cached = { value, at: Date.now() };
  return value;
}

export type ModerationVerdict = { tier: Tier; term?: string };

/** Classify a comment body against the CMS wordlists. */
export async function moderateBody(body: string): Promise<ModerationVerdict> {
  const settings = await getSettings();
  if (!settings.enabled) return { tier: "clean" };
  return classify(body, settings.blockTerms, settings.reviewTerms);
}
