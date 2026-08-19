import { defineField, defineType } from 'sanity'
import { AdminOnlyKeyInput } from '../../lib/components/AdminOnlyKeyInput'

export default defineType({
  name: 'workType',
  title: 'Work Types',
  type: 'document',
  fields: [
    defineField({
      name: 'key',
      title: 'Unique Key (Admin Only)',
      type: 'string',
      description: 'Used as the value in forms and database. Should be uppercase with underscores (e.g., RESEARCH, NGO). ⚠️ Must match Prisma enum values exactly.',
      validation: Rule => Rule.required().regex(/^[A-Z_]+$/, 'Key must be uppercase with underscores only (e.g., RESEARCH, NGO)'),
      components: {
        input: AdminOnlyKeyInput
      }
    }),
    defineField({
      name: 'label',
      title: 'Label',
      type: 'internationalizedArrayString',
      description: 'The display name for this work type in different languages',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'internationalizedArrayText',
      description: 'Optional description for this work type',
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Order in which this appears in forms (lower numbers first)',
      initialValue: 0,
    }),
    defineField({
      name: 'isActive',
      title: 'Is Active',
      type: 'boolean',
      description: 'Whether this work type is available for selection. New work types default to inactive until developer sync.',
      initialValue: false,
    }),
  ],
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
    {
      title: 'Key',
      name: 'keyAsc',
      by: [{ field: 'key', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      key: 'key',
      label: 'label',
      isActive: 'isActive',
    },
    prepare(selection) {
      const { key, label, isActive } = selection
      // Try to get English label or first available
      const displayLabel = label?.find((l: { _key?: string; value?: string }) => l._key === 'en')?.value ||
                          label?.[0]?.value ||
                          key

      return {
        title: displayLabel,
        subtitle: `Key: ${key}${!isActive ? ' (Inactive)' : ''}`,
      }
    },
  },
})