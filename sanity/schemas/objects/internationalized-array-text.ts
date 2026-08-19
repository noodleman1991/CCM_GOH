import { defineType } from 'sanity'

export default defineType({
  name: 'internationalizedArrayText',
  title: 'Internationalized Text',
  type: 'array',
  of: [
    {
      type: 'object',
      name: 'localizedText',
      title: 'Localized Text',
      fields: [
        {
          name: 'value',
          title: 'Value',
          type: 'text',
          rows: 3,
          validation: Rule => Rule.required(),
        },
      ],
      preview: {
        select: {
          value: 'value',
          key: '_key',
        },
        prepare({ value, key }) {
          const languageNames: Record<string, string> = {
            en: 'English',
            es: 'Español',
            fr: 'Français',
            ar: 'العربية',
          }
          return {
            title: value?.substring(0, 50) + (value?.length > 50 ? '...' : ''),
            subtitle: languageNames[key] || key,
          }
        },
      },
    },
  ],
  options: {
    list: [
      { _type: 'localizedText', _key: 'en', title: 'English' },
      { _type: 'localizedText', _key: 'es', title: 'Español' },
      { _type: 'localizedText', _key: 'fr', title: 'Français' },
      { _type: 'localizedText', _key: 'ar', title: 'العربية' },
    ],
    layout: 'list',
  },
  validation: Rule => Rule.custom((value) => {
    if (!value || value.length === 0) return true

    const keys = value.map((item) => (item as { _key?: string })._key)
    const uniqueKeys = new Set(keys)

    if (keys.length !== uniqueKeys.size) {
      return 'Each language can only appear once'
    }

    return true
  }),
})