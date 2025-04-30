import {
    ClerkProvider,
    SignInButton,
    SignUpButton,
    SignedIn,
    SignedOut,
    UserButton,
} from '@clerk/nextjs';
import { useLocale } from 'next-intl';
import { arSA, esES, frFR, enGB } from '@clerk/localizations';

const clerkLocalizationsMap = {
    en: enGB,
    fr: frFR,
    es: esES,
    ar: arSA,
};

export default function FrontendLayout({
                                           children,
                                       }: {
    children: React.ReactNode;
}) {
    const locale = useLocale();

    const clerkLocalization = clerkLocalizationsMap[locale as keyof typeof clerkLocalizationsMap] || enGB;

    return (
        <ClerkProvider localization={clerkLocalization}>
            <header className="flex justify-end items-center p-4 gap-4 h-16">
                <SignedOut>
                    <SignInButton />
                    <SignUpButton />
                </SignedOut>
                <SignedIn>
                    <UserButton />
                </SignedIn>
            </header>
            {children}
        </ClerkProvider>
    );
}
