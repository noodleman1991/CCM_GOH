/**
 * What the onboarding "About you" step saves (dashboard/profile spec D4).
 * Every field is optional: only what the member actually filled in is
 * written, trimmed and once each, and a prompt answer only when it has both
 * its question and an answer. Pure.
 */
export type AboutYouInput = {
  pronouns?: string | null;
  languages?: string[];
  lookingFor?: string[];
  focusTopics?: string[];
  promptId?: string | null;
  promptAnswer?: string | null;
};

type ProfileWrites = Partial<{ pronouns: string; languages: string[]; lookingFor: string[]; focusTopics: string[] }>;

const list = (items: string[] | undefined) => [...new Set((items ?? []).map((i) => i.trim()).filter(Boolean))];

export function aboutYouWrites(input: AboutYouInput): { profile: ProfileWrites; promptAnswer: { promptId: string; answer: string } | null } {
  const profile: ProfileWrites = {};
  const pronouns = input.pronouns?.trim();
  if (pronouns) profile.pronouns = pronouns;
  for (const key of ["languages", "lookingFor", "focusTopics"] as const) {
    const values = list(input[key]);
    if (values.length > 0) profile[key] = values;
  }
  const promptId = input.promptId?.trim();
  const answer = input.promptAnswer?.trim();
  return { profile, promptAnswer: promptId && answer ? { promptId, answer } : null };
}
