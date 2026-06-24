import { defineType, defineField } from "sanity";

/**
 * A typed link from one piece of content to another (redesign SANITY_SCHEMA §7,
 * §9). Polymorphic infrastructure: `target` can reference any hub content type,
 * and `relation` names how they relate. Typed `relatedContent[]` fields on each
 * document use this object, and the front end renders each target with a
 * content-type-aware card ("Related case study", "Related lived experience"…).
 *
 * Connections are authored from whichever side is most natural (e.g. a case study
 * links its related lived experience); the other side surfaces it via a GROQ
 * `references()` back-query, so the relationship is bidirectional in display.
 */
export const RELATION_OPTIONS = [
  { title: "About", value: "about" },
  { title: "Related", value: "related" },
  { title: "Part of", value: "part-of" },
  { title: "Output of", value: "output-of" },
  { title: "Follows up on", value: "follows-up" },
  { title: "Background to", value: "background" },
] as const;

const connection = defineType({
  name: "connection",
  title: "Connection",
  type: "object",
  fields: [
    defineField({
      name: "relation",
      title: "Relation",
      type: "string",
      options: { list: RELATION_OPTIONS as unknown as string[], layout: "dropdown" },
      initialValue: "related",
      description: "How this item relates to the target.",
    }),
    defineField({
      name: "target",
      title: "Linked content",
      type: "reference",
      to: [
        { type: "caseStudy" },
        { type: "livedExperience" },
        { type: "newsPost" },
        { type: "researchOutput" },
        { type: "report" },
        { type: "project" },
        { type: "regionalCommunity" },
      ],
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      relation: "relation",
      csTitle: "target.title.en",
      leTitle: "target.title.en",
      projTitle: "target.title",
      type: "target._type",
    },
    prepare({ relation, csTitle, projTitle, type }) {
      const title = csTitle || projTitle || "Linked content";
      const relLabel =
        RELATION_OPTIONS.find((r) => r.value === relation)?.title || "Related";
      return { title, subtitle: `${relLabel} · ${type || ""}` };
    },
  },
});

export default connection;
