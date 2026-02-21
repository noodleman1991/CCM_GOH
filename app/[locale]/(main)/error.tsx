"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors');

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 text-center px-4">
      <h2 className="text-2xl font-bold text-foreground">
        {t('errorTitle')}
      </h2>
      <p className="text-muted-foreground max-w-md">
        {t('errorDescription')}
      </p>
      <div className="flex gap-3">
        <Button onClick={reset} variant="default">
          {t('tryAgain')}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">{t('goHome')}</Link>
        </Button>
      </div>
    </div>
  );
}
