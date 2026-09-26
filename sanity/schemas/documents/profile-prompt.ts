import { defineType, defineField } from "sanity";
import { MessageCircleQuestion } from "lucide-react";
import { orderRankField } from "@sanity/orderable-document-list";
import { createLocalizedField } from "../shared/localized-field";

/**
 * A "Hinge-style" profile prompt that members can pick and answer to make their
 * profile (and onboarding) more personal. Editor-curated: add, retire, reorder
 * prompts here without code. The prompt text is a Lane-B localized object; the
 * user's answer is stored in Postgres (ProfilePromptAnswer), keyed by this doc's _id.
 */
export default defineType({
  name: "profilePrompt",
  title: "Profile Prompt",
  type: "document",
  icon: MessageCircleQuestion,
  fields: [
    {
      ...createLocalizedField("prompt", "Prompt", "string", {
        required: true,
        description:
          "A conversational prompt members answer, e.g. 'Climate change feels personal to me because…'. Keep it open and inviting.",
      }),
    },
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      description: "Groups prompts so the picker can offer a balanced mix.",
      options: {
        list: [
          { title: "About you", value: "about" },
          { title: "Collaboration", value: "collaboration" },
          { title: "Lived experience", value: "lived-experience" },
          { title: "Research & work", value: "research" },
        ],
        layout: "radio",
      },
      initialValue: "about",
    }),
    defineField({
      name: "active",
      title: "Active",
      type: "boolean",
      description: "Only active prompts are offered to members. Turn off to retire a prompt without losing existing answers.",
      initialValue: true,
    }),
    orderRankField({ type: "profilePrompt" }),
  ],
  preview: {
    select: { title: "prompt.en", category: "category", active: "active" },
    prepare({ title, category, active }) {
      return {
        title: title || "Untitled prompt",
        subtitle: `${active === false ? "○ Retired" : "● Active"} · ${category || "about"}`,
      };
    },
  },
});
