import { defineField, defineType } from "sanity";
import { ListCollapse } from "lucide-react";
import { orderRankField } from "@sanity/orderable-document-list";
import { createLocalizedField } from "../shared/localized-field";

export default defineType({
  name: "faq",
  title: "FAQ",
  type: "document",
  icon: ListCollapse,
  fields: [
    // i18n: the question is a short string → field-level localized object (Lane B).
    createLocalizedField("question", "Question", "string", {
      description: "The question, in each language. English is shown if a translation is missing.",
      required: true,
    }),
    // i18n: the answer is localized rich text, one editor per language.
    createLocalizedField("answer", "Answer", "block-content", {
      description: "The answer (rich text), in each language.",
    }),
    // Deprecated single-language fields, kept until content is migrated + readers
    // switch over. Do not author here.
    defineField({
      name: "title",
      title: "Question (legacy, single-language)",
      type: "string",
      hidden: true,
      deprecated: { reason: "Use the localized Question field above." },
    }),
    defineField({
      name: "body",
      title: "Answer (legacy, single-language)",
      type: "block-content",
      hidden: true,
      deprecated: { reason: "Use the localized Answer field above." },
    }),
    orderRankField({ type: "faq" }),
  ],

  preview: {
    select: {
      questionEn: "question.en",
      legacyTitle: "title",
    },
    prepare({ questionEn, legacyTitle }) {
      return { title: questionEn || legacyTitle || "Untitled FAQ" };
    },
  },
});
