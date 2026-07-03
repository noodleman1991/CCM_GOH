import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SectionPadding } from "@/sanity.types";

interface SubmitStoryBannerProps {
  _key?: string;
  padding?: SectionPadding | null;
  title?: string | null;
  subtitle?: string | null;
  ctaLabel?: string | null;
  illustration?: {
    asset?: {
      _id: string;
      url: string | null;
      metadata: {
        lqip: string | null;
        dimensions: { width: number | null; height: number | null } | null;
      } | null;
    } | null;
  } | null;
  locale?: string;
}

/**
 * Submit-story banner (handoff §4.1): full-bleed CCM-navy band inviting people
 * to share their lived experience. CMS fields are optional overrides; empty
 * fields fall back to localized i18n defaults so one block serves all locales.
 * The CTA always points at the lived-experience submit flow (which handles its
 * own sign-in gate). Illustration is decorative, inline-end, RTL-safe.
 */
export default async function SubmitStoryBanner({
  padding,
  title,
  subtitle,
  ctaLabel,
  illustration,
  locale = "en",
}: SubmitStoryBannerProps) {
  const t = await getTranslations({ locale, namespace: "submitStoryBanner" });
  const heading = title || t("title");
  const body = subtitle || t("subtitle");
  const cta = ctaLabel || t("cta");
  const art = illustration?.asset?.url ? illustration.asset : null;

  return (
    <section
      className={cn(
        "relative overflow-hidden bg-ccm-midnight",
        padding?.top !== false && "pt-14 sm:pt-20",
        padding?.bottom !== false && "pb-14 sm:pb-20"
      )}
    >
      <div className={cn("container relative max-w-4xl text-center", art && "sm:pe-36 lg:pe-44")}>
        <h2 className="font-heading text-2xl font-bold text-balance text-white sm:text-3xl">
          {heading}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-balance text-white/80">{body}</p>
        <Button
          asChild
          size="lg"
          className="mt-8 min-h-[44px] bg-white text-ccm-midnight hover:bg-ccm-sky"
        >
          <Link href="/lived-experiences/submit">{cta}</Link>
        </Button>
        {art && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute end-0 top-1/2 hidden -translate-y-1/2 sm:block"
          >
            <Image
              src={art.url!}
              alt=""
              width={art.metadata?.dimensions?.width || 320}
              height={art.metadata?.dimensions?.height || 320}
              placeholder={art.metadata?.lqip ? "blur" : undefined}
              blurDataURL={art.metadata?.lqip || ""}
              className="h-24 w-auto object-contain lg:h-36"
            />
          </div>
        )}
      </div>
    </section>
  );
}
