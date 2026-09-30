"use client";
import SectionContainer from "@/components/ui/section-container";
import Image from "next/image";
import { imageUrl } from "@/lib/content/images";
import { Fragment, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { getLocalizedField } from "@/lib/localization-utils";
import { useTranslations } from "next-intl";
import { isRTL } from "@/i18n/i18n-helpers";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { heading, gridGap } from "@/lib/design-tokens";
import type { SectionPadding } from "@/components/ui/section-container";

/** A field that carries either a plain string or a `{en, es, fr, ar}` map —
 *  the shape `getLocalizedField` resolves. Matches the precedent already
 *  used for this exact pattern in lib/content/discovery.ts's LocalizedText. */
type LocalizedText = string | Record<string, string> | null;

interface LogoCloud1Props {
  padding?: SectionPadding | null;
  title?: LocalizedText;
  description?: LocalizedText;
  images?: LogoImage[] | null;
  /** Funded by / Hosted by organisations, shown larger above the partners (grid only). */
  leads?: Array<LogoImage & { role: "fundedBy" | "hostedBy" }> | null;
  locale?: string;
  layout?: "marquee" | "grid" | "carousel";
  motionSpeed?: "default" | "slow";
}

type LogoImage = {
  asset?: { _id?: string; mimeType?: string; metadata?: { lqip?: string; dimensions?: { width?: number; height?: number } } } | null;
  alt?: string;
  label?: string;
  orgType?: string;
  /** Partner organisations: their page on the hub, and their name. */
  href?: string | null;
  name?: string | null;
};

const TYPE_ORDER = [
  "ngo", "research", "university", "government",
  "international", "company", "community", "foundation", "other",
];

/** The logo itself, or — for an organisation with no logo yet — its name. */
function LogoMark({ image, size, priority }: { image: LogoImage; size: "tile" | "strip" | "lead"; priority?: boolean }) {
  if (!image.asset) {
    return (
      <span className="inline-flex h-20 items-center justify-center rounded-lg bg-ccm-mist px-4 text-center text-sm font-bold text-ccm-midnight">
        {image.name ?? image.label ?? image.alt}
      </span>
    );
  }
  return (
    <Image
      src={imageUrl(image, { width: 400, height: 225 })}
      alt={image.alt || image.name || image.label || ""}
      // A fixed box, not `w-auto`: with a responsive srcset, `w-auto` let the
      // browser size logos from the smallest candidate (they rendered ~11px).
      className={cn("object-contain", size === "lead" ? "h-24 w-full" : size === "tile" ? "h-16 w-full" : "h-24 w-24")}
      priority={priority}
      placeholder={image?.asset?.metadata?.lqip && image?.asset?.mimeType !== "image/svg+xml" ? "blur" : undefined}
      blurDataURL={image?.asset?.metadata?.lqip || ""}
      width={image.asset?.metadata?.dimensions?.width || 220}
      height={image?.asset?.metadata?.dimensions?.height || 90}
      sizes={size === "lead" ? "(min-width: 640px) 320px, 70vw" : size === "tile" ? "(min-width: 1024px) 16vw, (min-width: 640px) 25vw, 40vw" : "96px"}
    />
  );
}

/** Organisations link to their hub page; other logos are plain. */
function Linked({ image, children, hidden }: { image: LogoImage; children: React.ReactNode; hidden?: boolean }) {
  if (!image.href) return <>{children}</>;
  return (
    <Link
      href={image.href}
      aria-label={image.name ?? undefined}
      tabIndex={hidden ? -1 : undefined}
      aria-hidden={hidden || undefined}
      className="block rounded-lg outline-offset-4 focus-visible:outline-2 focus-visible:outline-ccm-sea"
    >
      {children}
    </Link>
  );
}

function LogoTile({ image, label }: { image: LogoImage; label?: string }) {
  return (
    <Linked image={image}>
      <figure className="flex flex-col items-center justify-center gap-2 text-center">
        <div className="flex h-20 w-full items-center justify-center">
          <LogoMark image={image} size="tile" />
        </div>
        {label && image.asset && <figcaption className="text-xs font-medium text-muted-foreground">{label}</figcaption>}
      </figure>
    </Linked>
  );
}

/** A wall/carousel tile: the logo in a fixed box, full colour, the name underneath. */
function NamedTile({ image, size = "tile", role }: { image: LogoImage; size?: "tile" | "lead"; role?: string }) {
  const name = image.name ?? image.label ?? image.alt ?? "";
  return (
    <Linked image={image}>
      <figure
        className={cn(
          "flex h-full flex-col items-center gap-3 rounded-2xl border border-ccm-midnight/10 bg-white p-4 text-center transition hover:border-ccm-sea/30 hover:shadow-sm",
          size === "lead" && "p-6",
        )}
      >
        {role && <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-ccm-sea">{role}</span>}
        <div className={cn("flex w-full items-center justify-center", size === "lead" ? "h-24" : "h-16")}>
          <LogoMark image={image} size={size} />
        </div>
        {image.asset && name && (
          <figcaption className={cn("font-medium text-ccm-midnight/80", size === "lead" ? "text-base" : "text-xs")}>{name}</figcaption>
        )}
      </figure>
    </Linked>
  );
}

export default function LogoCloud1({
  padding,
  title,
  description,
  images,
  leads,
  locale = "en",
  layout = "marquee",
  motionSpeed = "default",
}: LogoCloud1Props) {
  const rtl = isRTL(locale);
  const prefersReducedMotion = useReducedMotion();
  const tTypes = useTranslations("organizations.types");
  const tLogos = useTranslations("logos");
  const rowRef = useRef<HTMLDivElement>(null);

  const supportedLocale = (locale || "en") as "en" | "es" | "fr" | "ar";
  const localizedTitle =
    typeof title === "string" ? title : getLocalizedField(title, supportedLocale, "");
  const localizedDescription =
    typeof description === "string" ? description : getLocalizedField(description, supportedLocale, "");

  const imgs = (images as LogoImage[] | undefined) ?? [];
  const hasTypes = imgs.some((i) => i.orgType);

  const header = (
    <div className="mx-auto max-w-6xl px-4 @content-sm/page:px-6 @content-lg/page:px-8">
      <div className="mb-8 text-center">
        {localizedTitle && (
          <h2 className={cn("font-bold font-heading text-balance text-ccm-midnight", heading("md"))}>
            {localizedTitle}
          </h2>
        )}
        {localizedDescription && (
          <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground @content-md/page:text-lg">
            {localizedDescription}
          </p>
        )}
      </div>
    </div>
  );

  // GRID with Funded by / Hosted by — the grouped wall (spec §3.4).
  if (layout === "grid" && leads && leads.length > 0) {
    return (
      <SectionContainer padding={padding}>
        {header}
        <div className="mx-auto max-w-6xl space-y-10 px-4 @content-sm/page:px-6 @content-lg/page:px-8">
          <div className="grid gap-4 @content-sm/page:grid-cols-2 @content-sm/page:mx-auto @content-sm/page:max-w-3xl">
            {leads.map((lead) => (
              <NamedTile key={lead.href ?? lead.name} image={lead} size="lead" role={tLogos(lead.role)} />
            ))}
          </div>
          {imgs.length > 0 && (
            <div>
              <h3 className="mb-4 text-center text-sm font-bold uppercase tracking-[0.14em] text-ccm-water">{tLogos("partners")}</h3>
              <div className={cn("grid grid-cols-2 @content-sm/page:grid-cols-3 @content-xl/page:grid-cols-4", gridGap("md"))}>
                {imgs.map((image, index) => (
                  <NamedTile key={`${image.href ?? image.asset?._id}-${index}`} image={image} />
                ))}
              </div>
            </div>
          )}
        </div>
      </SectionContainer>
    );
  }

  // ONE LINE — a row visitors move themselves; nothing moves by itself (spec §3.5).
  if (layout === "carousel") {
    const scroll = (dir: 1 | -1) => {
      const row = rowRef.current;
      if (!row) return;
      const step = row.clientWidth * 0.8 * dir * (rtl ? -1 : 1);
      row.scrollBy({ left: step, behavior: prefersReducedMotion ? "auto" : "smooth" });
    };
    const arrow =
      "hidden size-11 flex-none items-center justify-center rounded-full border border-ccm-sea/25 bg-white text-ccm-sea transition hover:bg-ccm-sea/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ccm-sea [@media(hover:hover)]:inline-flex";
    return (
      <SectionContainer padding={padding}>
        {header}
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 @content-sm/page:px-6 @content-lg/page:px-8">
          <button type="button" onClick={() => scroll(-1)} aria-label={tLogos("previous")} className={arrow}>
            <ChevronLeft className="size-5 rtl:-scale-x-100" aria-hidden />
          </button>
          <div
            ref={rowRef}
            role="region"
            aria-label={localizedTitle || tLogos("partners")}
            tabIndex={0}
            className="flex min-w-0 flex-1 snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-ccm-sea [&::-webkit-scrollbar]:hidden"
          >
            {imgs.map((image, index) => (
              <div key={`${image.href ?? image.asset?._id}-${index}`} className="w-40 flex-none snap-start">
                <NamedTile image={image} />
              </div>
            ))}
          </div>
          <button type="button" onClick={() => scroll(1)} aria-label={tLogos("next")} className={arrow}>
            <ChevronRight className="size-5 rtl:-scale-x-100" aria-hidden />
          </button>
        </div>
      </SectionContainer>
    );
  }

  // GRID layout — calm, spacious, optionally grouped by institution type.
  if (layout === "grid") {
    const groups = hasTypes
      ? TYPE_ORDER.map((type) => ({ type, items: imgs.filter((i) => i.orgType === type) })).filter(
          (g) => g.items.length > 0
        )
      : [{ type: null as string | null, items: imgs }];

    return (
      <SectionContainer padding={padding}>
        {header}
        <div className="mx-auto max-w-6xl px-4 @content-sm/page:px-6 @content-lg/page:px-8">
          {groups.map((group) => (
            <div key={group.type ?? "all"} className="mb-10 last:mb-0">
              {group.type && (
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ccm-water">
                  {tTypes(group.type)}
                </h3>
              )}
              <div className={cn("grid grid-cols-2 @content-sm/page:grid-cols-3 @content-xl/page:grid-cols-4", gridGap("lg"))}>
                {group.items.map((image, index) => (
                  <LogoTile key={`${image.asset?._id}-${index}`} image={image} label={image.label} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionContainer>
    );
  }

  // MARQUEE layout (default) — scrolling strip, reduced-motion + speed aware.
  const duration = motionSpeed === "slow" ? 40 : 20;
  return (
    <SectionContainer padding={padding} className="overflow-hidden">
      {header}
      <div className="relative flex overflow-hidden before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-10 before:bg-linear-to-r rtl:before:bg-linear-to-l before:from-background before:to-transparent before:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-10 after:bg-linear-to-l rtl:after:bg-linear-to-r after:from-background after:to-transparent after:content-['']">
        <motion.div
          transition={prefersReducedMotion ? undefined : { duration, ease: "linear", repeat: Infinity }}
          animate={prefersReducedMotion ? undefined : { x: rtl ? ["0%", "50%"] : ["0%", "-50%"] }}
          className="flex w-max gap-24 pe-24"
        >
          {[...new Array(2)].map((_, arrayIndex) => (
            <Fragment key={arrayIndex}>
              {imgs.map((image, index) => (
                <div
                  key={`${image.asset?._id ?? image.href}-${arrayIndex}-${index}`}
                  className="flex h-24 w-24 shrink-0 items-center justify-center"
                  aria-hidden={arrayIndex === 1 || undefined}
                >
                  {/* The strip repeats once so it can loop; the repeat is hidden from screen readers and the keyboard. */}
                  <Linked image={image} hidden={arrayIndex === 1}>
                    <LogoMark image={image} size="strip" priority={arrayIndex === 0 && index < 3} />
                  </Linked>
                </div>
              ))}
            </Fragment>
          ))}
        </motion.div>
      </div>
    </SectionContainer>
  );
}
