import { defineType } from 'sanity'

export default defineType({
  name: 'internationalizedArrayString',
  title: 'Internationalized String',
  type: 'array',
  of: [
    {
      type: 'object',
      name: 'localizedString',
      title: 'Localized String',
      fields: [
        {
          name: 'value',
          title: 'Value',
          type: 'string',
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
            title: value,
            subtitle: languageNames[key] || key,
          }
        },
      },
    },
  ],
  options: {
    list: [
      { _key: 'en', title: 'English' },
      { _key: 'es', title: 'Español' },
      { _key: 'fr', title: 'Français' },
      { _key: 'ar', title: 'العربية' },
    ],
    layout: 'list',
  },
  validation: Rule => Rule.required().min(1).custom((value) => {
    if (!value) return true

    const keys = value.map((item: any) => item._key)
    const uniqueKeys = new Set(keys)

    if (keys.length !== uniqueKeys.size) {
      return 'Each language can only appear once'
    }

    // Require at least English
    if (!keys.includes('en')) {
      return 'English translation is required'
    }

    return true
  }),
})