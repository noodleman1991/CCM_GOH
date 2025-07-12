import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { ClerkProvider } from '@clerk/nextjs';
import { enGB } from '@clerk/localizations';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from "next-intl/server";

// Studio-specific metadata
export const metadata: Metadata = {
    title: "Sanity Studio | Content Management",
    description: "Content management system powered by Sanity Studio",
    robots: "noindex, nofollow", // Studio should not be indexed
};

// For now, studio is English-only but prepared for future internationalization
const STUDIO_DEFAULT_LOCALE = 'en';

export default async function StudioLayout({
                                               children,
                                               params,
                                           }: {
    children: React.ReactNode;
    params: Promise<{locale: string}>;
}) {
    const { locale } = await params;

    // For now, force English for studio, but keep locale structure for future expansion
    const studioLocale = STUDIO_DEFAULT_LOCALE;

    // Get messages for the studio locale (currently just English)
    const messages = await getMessages({ locale: studioLocale });

    return (
        <ClerkProvider localization={enGB}>
            <NextIntlClientProvider messages={messages}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="light" // Studio typically works better with light theme
                    enableSystem={false}
                    disableTransitionOnChange
                >
                    <div className="min-h-screen bg-white dark:bg-gray-950">
                        {children}
                    </div>
                </ThemeProvider>
            </NextIntlClientProvider>
        </ClerkProvider>
    );
}
