import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from "next-intl/server";
import { ClerkProvider } from '@clerk/nextjs';
import { arSA, esES, frFR, enGB } from '@clerk/localizations';
// import { notFound } from 'next/navigation';
// import { routing } from '@/i18n/routing';
import { rtlLocales } from '@/i18n/routing';
import ConditionalSidebarLayout from "@/components/conditional-sidebar-layout";

const clerkLocalizationsMap = {
    en: enGB,
    fr: frFR,
    es: esES,
    ar: arSA,
};

const isProduction = process.env.NEXT_PUBLIC_SITE_ENV === "production";

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL!),
    title: {
        template: "%s | Schema UI Starter",
        default: "Sanity Next.js Website | Schema UI Starter",
    },
    openGraph: {
        images: [
            {
                url: `${process.env.NEXT_PUBLIC_SITE_URL}/images/og-image.jpg`,
                width: 1200,
                height: 630,
            },
        ],
        locale: "en_US",
        type: "website",
    },
    robots: !isProduction ? "noindex, nofollow" : "index, follow",
};

const fontSans = FontSans({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800"],
    variable: "--font-sans",
});

export default async function LocaleLayout({
                                               children,
                                               params,
                                           }: {
    children: React.ReactNode;
    params: Promise<{locale: string}>;
}) {
    const { locale } = await params;
    //const locale = await getLocale();
    const isRtl = rtlLocales.includes(locale);

    // Providing all messages to the client - todo: nuance
    const messages = await getMessages();

    const clerkLocalization = clerkLocalizationsMap[locale as keyof typeof clerkLocalizationsMap] || enGB;

    // if (!hasLocale(routing.locales, locale)) {
    //     notFound();
    // }

    return (
        <html lang={locale} dir={isRtl ? 'rtl' : 'ltr'} suppressHydrationWarning>
        <head>
            <link rel="icon" href="/favicon.ico" />
        </head>
        <body
            className={cn(
                "min-h-screen bg-background font-sans antialiased overscroll-none overflow-x-hidden",
                fontSans.variable
            )}
        >
        <ClerkProvider localization={clerkLocalization}>
            <NextIntlClientProvider messages={messages}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <ConditionalSidebarLayout isRtl={isRtl}>
                        {children}
                    </ConditionalSidebarLayout>
                </ThemeProvider>
                <Toaster position="top-center" richColors />
            </NextIntlClientProvider>
        </ClerkProvider>
        </body>
        </html>
    );
}
