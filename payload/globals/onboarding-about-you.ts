import type { Field, GlobalConfig } from "payload";
import { isAnyone, isEditor } from "@/payload/access";
import { localizedText, localizedTextarea } from "@/payload/fields/localized";

/** One choice a member can tick: a stable value (what's stored) and its words in each language. */
function optionList(name: string, label: string, description: string): Field {
  return {
    name,
    type: "array",
    label,
    labels: { singular: "Option", plural: "Options" },
    admin: { description, initCollapsed: true },
    fields: [
      {
        name: "value",
        type: "text",
        required: true,
        admin: { description: "A short fixed id, like research-partners. Don't change it once members have chosen it — it's what their profile stores." },
      },
      localizedText("label", { required: true, admin: { description: "What members see, in each language." } }),
    ],
  };
}

/**
 * The onboarding "About you" step (dashboard/profile spec D4): its words and
 * the "Looking for" and "Focus areas" choices, which Edit profile offers too.
 * Every field is optional for members; while a list here is empty the site
 * offers a short starter list (lib/onboarding/about-you-options.ts).
 *
 * Not part of ONBOARDING_GLOBALS: those six are one copy tree split for
 * Postgres's column limit and composed back on read; this one is read on its own.
 */
export const OnboardingAboutYou: GlobalConfig = {
  slug: "onboardingAboutYou",
  label: "Step 3: About you",
  access: {
    // The onboarding flow reads this for members mid-signup.
    read: isAnyone,
    update: isEditor,
  },
  admin: {
    group: "Settings",
    description: "Step 3: headline, what brought them here, what they're looking for, focus areas and one prompt. Edit the choices members pick from here.",
  },
  fields: [
    localizedText("title", { admin: { description: "The step's heading. Empty: \"About you\"." } }),
    localizedTextarea("description", { admin: { description: "One or two lines under the heading. Empty: the standard wording." } }),
    optionList("lookingForOptions", "Looking for — choices", "What members can say they're looking for, e.g. research partners, a mentor, funding."),
    optionList("focusTopicOptions", "Focus areas — choices", "The climate and mental-health themes members can pick, e.g. eco-anxiety, young people."),
    localizedText("promptIntro", { admin: { description: "The line above the prompt picker. Empty: \"Pick a question and answer it in your own words.\"" } }),
  ],
};
