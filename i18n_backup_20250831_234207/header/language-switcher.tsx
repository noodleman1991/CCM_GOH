// // components/header/language-switcher.tsx
// 'use client';
//
// import { useParams } from 'next/navigation';
// import Link from 'next/link';
// import { i18n } from '@/lib/i18n';
// import { Button } from '@/components/ui/button';
// import { cn } from '@/lib/utils';
// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuItem,
//     DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu';
// import { Translation } from '@/lib/types';
//
// export default function LanguageSwitcher({ translations = [] }: { translations?: Translation[] }) {
//     const params = useParams();
//     const currentLocale = Array.isArray(params.locale) ? params.locale[0] : params.locale;
//
//     // Find the current language info
//     const currentLanguage = i18n.languages.find(lang => lang.id === currentLocale);
//
//     return (
//         <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//                 <Button variant="ghost" size="sm">
//                     {currentLanguage?.title || 'Language'}
//                 </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent align="end">
//                 {i18n.languages.map(lang => {
//                     const translation = translations.find(t => t.language === lang.id);
//                     const path = translation?.path || `/${lang.id}`;
//
//                     return (
//                         <DropdownMenuItem key={lang.id} asChild>
//                             <Link
//                                 href={path}
//                                 className={cn(
//                                     "w-full",
//                                     currentLocale === lang.id && "font-bold"
//                                 )}
//                             >
//                                 {lang.title}
//                             </Link>
//                         </DropdownMenuItem>
//                     );
//                 })}
//             </DropdownMenuContent>
//         </DropdownMenu>
//     );
// }
