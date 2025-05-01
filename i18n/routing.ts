import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
    locales: ['en', 'es', 'fr', 'ar'],
    defaultLocale: 'en'
});

export const rtlLocales = ['ar'];
