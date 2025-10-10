import { defineType } from 'sanity';
import { Users } from 'lucide-react';

export default defineType({
  name: 'team-grid',
  title: 'Team Grid',
  type: 'object',
  icon: Users,
  fields: [
    {
      name: 'mode',
      title: 'Content Mode',
      type: 'string',
      options: {
        list: [
          { title: 'Manual Selection', value: 'manual' },
          { title: 'Dynamic - From Regional Community', value: 'dynamic' },
        ],
        layout: 'radio',
      },
      initialValue: 'manual',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'manualMembers',
      title: 'Manual Member Selection',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'author' }],
        },
      ],
      hidden: ({ parent }) => parent?.mode !== 'manual',
      description: 'Manually select team members to display',
      validation: (Rule) =>
        Rule.custom((members, context) => {
          const parent = context.parent as { mode?: string } | undefined;
          const mode = parent?.mode;
          if (mode === 'manual' && (!members || !Array.isArray(members) || members.length === 0)) {
            return 'Please add at least one team member';
          }
          return true;
        }),
    },
    {
      name: 'regionalCommunity',
      title: 'Regional Community',
      type: 'reference',
      to: [{ type: 'regionalCommunity' }],
      hidden: ({ parent }) => parent?.mode !== 'dynamic',
      description: 'Select regional community to auto-populate team members',
      validation: (Rule) =>
        Rule.custom((community, context) => {
          const parent = context.parent as { mode?: string } | undefined;
          const mode = parent?.mode;
          if (mode === 'dynamic' && !community) {
            return 'Please select a regional community';
          }
          return true;
        }),
    },
    {
      name: 'gridColumns',
      title: 'Grid Columns',
      type: 'string',
      options: {
        list: [
          { title: '2 Columns', value: 'grid-cols-2' },
          { title: '3 Columns', value: 'grid-cols-3' },
          { title: '4 Columns', value: 'grid-cols-4' },
          { title: '5 Columns', value: 'grid-cols-5' },
        ],
        layout: 'radio',
      },
      initialValue: 'grid-cols-4',
    },
    {
      name: 'showTitle',
      title: 'Show Section Title',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'title',
      title: 'Section Title',
      type: 'string',
      initialValue: 'Our Team',
      hidden: ({ parent }) => !Boolean(parent?.showTitle),
    },
    {
      name: 'showDescription',
      title: 'Show Description',
      type: 'boolean',
      initialValue: false,
    },
    {
      name: 'description',
      title: 'Description',
      type: 'styled-block-content',
      hidden: ({ parent }) => !Boolean(parent?.showDescription),
    },
    {
      name: 'displayRole',
      title: 'Display Role',
      type: 'boolean',
      initialValue: true,
      description: "Show member's role in the community",
    },
    {
      name: 'displayAffiliation',
      title: 'Display Affiliation',
      type: 'boolean',
      initialValue: true,
      description: "Show member's organizational affiliation",
    },
  ],
  preview: {
    select: {
      mode: 'mode',
      title: 'title',
      memberCount: 'manualMembers',
      community: 'regionalCommunity.name.en',
    },
    prepare({ mode, title, memberCount, community }) {
      const count = memberCount ? memberCount.length : 0;
      const subtitle =
        mode === 'manual'
          ? `Manual - ${count} member${count !== 1 ? 's' : ''}`
          : `Dynamic - ${community || 'No community selected'}`;

      return {
        title: title || 'Team Grid',
        subtitle,
        media: Users,
      };
    },
  },
});
