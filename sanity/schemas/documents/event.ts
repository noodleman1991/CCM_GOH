import { defineField, defineType } from "sanity";
import { Calendar } from "lucide-react";

/**
 * Event — a member/project-created event that flows through the same moderation
 * pipeline as case studies and lived experiences (status / submittedBy /
 * reviewNotes; only "approved" is public). RSVPs live in the app DB (Prisma),
 * keyed by this document's _id.
 */
export default defineType({
  name: "event",
  title: "Event",
  type: "document",
  icon: Calendar,
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "when", title: "Date & location" },
    { name: "affiliations", title: "Affiliations" },
    { name: "review", title: "Review & Publishing" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      group: "content",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "content",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      group: "content",
      rows: 4,
    }),
    // Who created it + where it's scoped (community-wide vs a specific project).
    defineField({
      name: "scope",
      title: "Scope",
      type: "string",
      group: "content",
      options: {
        list: [
          { title: "Community", value: "community" },
          { title: "Project", value: "project" },
        ],
        layout: "radio",
      },
      initialValue: "community",
    }),

    // --- When & where -------------------------------------------------------
    defineField({
      name: "startAt",
      title: "Starts",
      type: "datetime",
      group: "when",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "endAt",
      title: "Ends",
      type: "datetime",
      group: "when",
      validation: (Rule) =>
        Rule.min(Rule.valueOfField("startAt")).warning("End should be after start."),
    }),
    defineField({
      name: "mode",
      title: "Mode",
      type: "string",
      group: "when",
      options: {
        list: [
          { title: "Online", value: "online" },
          { title: "In person", value: "in_person" },
          { title: "Hybrid", value: "hybrid" },
        ],
        layout: "radio",
      },
      initialValue: "online",
    }),
    defineField({
      name: "locationName",
      title: "Location / venue",
      type: "string",
      group: "when",
      description: "Venue name or city (for in-person/hybrid).",
    }),
    defineField({
      name: "place",
      title: "Place",
      type: "place",
      group: "when",
    }),
    defineField({
      name: "url",
      title: "Joining / details URL",
      type: "url",
      group: "when",
    }),

    // --- Affiliations -------------------------------------------------------
    defineField({
      name: "linkedProject",
      title: "Linked project (Collaboration id)",
      type: "string",
      group: "affiliations",
      description: "If scope = project: the Collaboration id this event belongs to.",
    }),
    defineField({
      name: "relatedCommunity",
      title: "Regional community",
      type: "reference",
      to: [{ type: "regionalCommunity" }],
      group: "affiliations",
    }),

    // --- Review workflow (mirrors case studies / lived experiences) ---------
    defineField({
      name: "status",
      title: "Publication Status",
      type: "string",
      group: "review",
      options: {
        list: [
          { title: "Pending Review", value: "pending" },
          { title: "Rejected", value: "rejected" },
          { title: "Needs Revision", value: "revision" },
          { title: "Approved (Published)", value: "approved" },
        ],
      },
      initialValue: "approved",
      description:
        "Only 'Approved' events appear publicly. Member/project submissions start as 'Pending Review'.",
    }),
    defineField({
      name: "submittedBy",
      title: "Submitted By",
      type: "string",
      group: "review",
      readOnly: true,
      description: "Clerk User ID of the submitter (set on in-app submission).",
    }),
    defineField({
      name: "reviewNotes",
      title: "Review Notes",
      type: "text",
      group: "review",
      rows: 3,
      description: "Internal notes / feedback to the submitter.",
    }),
  ],
  preview: {
    select: { title: "title", startAt: "startAt", status: "status" },
    prepare({ title, startAt, status }) {
      const when = startAt ? new Date(startAt).toLocaleDateString() : "no date";
      return { title: title || "Untitled event", subtitle: `${when} · ${status || "—"}` };
    },
  },
});
