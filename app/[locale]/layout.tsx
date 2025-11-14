import type { Metadata } from "next";
import Script from "next/script";
import "../globals.css";
import { cn } from "@/lib/utils";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from "next-intl/server";
import { ClerkProvider } from '@clerk/nextjs';
import { arSA, esES, frFR, enGB } from '@clerk/localizations';
import { rtlLocales } from '@/i18n/routing';
import { Poppins, Lato } from "next/font/google";
import OnboardingRedirectProvider from '@/components/onboarding/onboarding-redirect-provider';
import RevisionAlertProvider from '@/components/submissions/revision-alert-provider';

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-poppins",
    display: "swap",
});

const lato = Lato({
    subsets: ["latin"],
    weight: ["300", "400", "700"],
    variable: "--font-lato",
    display: "swap",
});

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
        template: "%s | Connecting Climate Minds",
        default: "Hub | Connecting Climate Minds",
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

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{locale: string}>;
}) {
    const resolvedParams = await params;
    const { locale } = resolvedParams;
    const isRtl = rtlLocales.includes(locale);
    const messages = await getMessages();
    const clerkLocalization = clerkLocalizationsMap[locale as keyof typeof clerkLocalizationsMap] || enGB;

    return (
        <html
            lang={locale}
            dir={isRtl ? 'rtl' : 'ltr'}
            className={`${poppins.variable} ${lato.variable}`}
            suppressHydrationWarning
        >
        <head>
            <link rel="icon" href="/favicon.ico" />
        </head>
        <body
            className={cn(
                "min-h-screen bg-background font-sans antialiased overscroll-none overflow-x-hidden",
                poppins.variable,
                lato.variable
            )}
        >
            <Script
                src="https://plausible.io/js/pa-3hEF5jJ5x-S__sKhqgipY.js"
                strategy="afterInteractive"
                async
            />
            <Script id="plausible-init" strategy="afterInteractive">
                {`
                    window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)};
                    plausible.init=plausible.init||function(i){plausible.o=i||{}};
                    plausible.init();
                `}
            </Script>
            <ClerkProvider localization={clerkLocalization}>
                <NextIntlClientProvider messages={messages}>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <OnboardingRedirectProvider>
                            <RevisionAlertProvider>
                                {children}
                            </RevisionAlertProvider>
                        </OnboardingRedirectProvider>
                    </ThemeProvider>
                    <Toaster position="top-center" richColors />
                </NextIntlClientProvider>
            </ClerkProvider>
        </body>
        </html>
    );
}
