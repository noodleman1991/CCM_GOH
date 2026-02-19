"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

export default function Custom404() {
    const t = useTranslations('errors');

    return (
        <div className="relative z-20 min-h-[80vh] flex items-center justify-center text-center">
            <div className="relative px-8 md:px-0 py-[4rem] sm:py-[5rem] md:py-[6.25rem] mx-auto sm:max-w-[37.5rem] md:max-w-[40.625rem] lg:max-w-[53.125rem] xl:max-w-[70rem]">
                <h2 className="font-bold text-[5vw] sm:text-[1.75rem] md:text-[2rem] lg:text-[3rem] xl:text-[4rem] leading-[1.2]">
                    {t('pageNotFoundTitle')}
                </h2>
                <p className="mt-7 text-lg text-muted-foreground">
                    {t.rich('pageNotFoundDescription', {
                        link: (chunks) => (
                            <Link href="/" className="underline hover:text-foreground">
                                {chunks}
                            </Link>
                        ),
                    })}
                </p>
            </div>
        </div>
    );
}
