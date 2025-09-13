import { defineField, defineType } from "sanity";
import { orderRankField } from "@sanity/orderable-document-list";
import { User } from "lucide-react";

export default defineType({
  name: "author",
  title: "Author / Member",
  type: "document",
  icon: User,
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "name",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Alternative Text",
        },
      ],
    }),
    defineField({
      name: "organizationalAffiliation",
      title: "Organizational Affiliation",
      type: "string",
      description: "The organization this person is affiliated with",
    }),
    defineField({
      name: "communityMemberships",
      title: "Community Memberships",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "community",
              title: "Community",
              type: "reference",
              to: [{ type: "regionalCommunity" }],
              validation: (Rule) => Rule.required(),
            },
            {
              name: "role",
              title: "Role in Community",
              type: "string",
              description: "Their role or position within this community",
            },
          ],
          preview: {
            select: {
              title: "community.name.en",
              subtitle: "role",
            },
            prepare({ title, subtitle }) {
              return {
                title: title || "Untitled Community",
                subtitle: subtitle || "No role specified",
              };
            },
          },
        },
      ],
      description: "Communities this person is a member of and their roles",
    }),
    orderRankField({ type: "author" }),
  ],
  preview: {
    select: {
      title: "name",
      media: "image",
      affiliation: "organizationalAffiliation",
    },
    prepare({ title, media, affiliation }) {
      return {
        title: title || "Untitled Author/Member",
        subtitle: affiliation || "No affiliation",
        media,
      };
    },
  },
});
