//
// import { notFound } from "next/navigation";
// import { fetchIndexHomepage } from "@/sanity/lib/fetch";
// import { generatePageMetadata } from "@/sanity/lib/metadata";
// import Homepage from "@/components/pages/homepage";
// import type { Metadata } from "next";
//
// interface PageProps {
//   params: { locale?: string };
// }
//
// export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
//   const locale = params?.locale || 'en';
//   const homepage = await fetchIndexHomepage({ locale });
//
//   if (!homepage) {
//     return {
//       title: 'Homepage',
//       description: 'Welcome to Connecting Climate Minds Hub'
//     };
//   }
//
//   return generatePageMetadata({
//     page: homepage,
//     slug: 'index',
//     locale,
//   });
// }
//
// export default async function RootPage({ params }: PageProps) {
//   const locale = params?.locale || 'en';
//   const homepage = await fetchIndexHomepage({ locale });
//
//   if (!homepage) {
//     notFound();
//   }
//
//   return <Homepage homepage={homepage} locale={locale} />;
// }
//
