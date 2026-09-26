import { useTranslations } from "next-intl";
import { Languages } from "lucide-react";

type Lang = "en" | "es" | "fr" | "ar";

export function OriginalLanguageNote({ contentLanguage, locale }: { contentLanguage: Lang | null | undefined; locale: Lang }) {
  const t = useTranslations("caseStudies");
  if (!contentLanguage || contentLanguage === locale) return null;
  const language = new Intl.DisplayNames([locale], { type: "language" }).of(contentLanguage) ?? contentLanguage;
  return (
    <p className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
      <Languages className="size-4" aria-hidden />
      {t("originallyWrittenIn", { language })}
    </p>
  );
}
