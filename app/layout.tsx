import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import { rtlLocales } from '@/i18n/routing';

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
                                       children, params
                                   }: {
    children: React.ReactNode;
    params: Promise<{locale: string}>;
}) {
    const {locale} = await params;
    const isRtl = rtlLocales.includes(locale);
    // if (!hasLocale(routing.locales, locale)) {
    //     notFound();
    // }
    return (
        <html lang={locale} dir={isRtl ? 'rtl' : 'ltr'} suppressHydrationWarning>
        <link rel="icon" href="/favicon.ico" />
        <body
            className={cn(
                "min-h-screen bg-background font-sans antialiased overscroll-none",
                fontSans.variable
            )}
        >
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            {/*<NextIntlClientProvider>{children}</NextIntlClientProvider>*/}
            {children}
        </ThemeProvider>
        <Toaster position="top-center" richColors />
        </body>
        </html>
    );
}
