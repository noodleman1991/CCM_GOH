import { useTranslations } from "next-intl";
import Image from "next/image";
import { MapPin, Play } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { TYPE_STYLE, type TypedCardItem } from "@/lib/cards/type-style";

/**
 * Task 13: the ONE card language (approved mock v3). Every content type keeps
 * a fixed identity — colour, eyebrow, signature element — and recomposes into
 * three densities:
 *   grid — cover strip + body (Atlas panel, region sections)
 *   row  — signature element leads, meta column trails (search results)
 *   mini — bento cell (homepage strips)
 *   lead — bento's tall editorial pick (cover + dek)
 *
 * Server-renderable (no hooks beyond next-intl); pass a fully-adapted
 * TypedCardItem — adapters live next to each surface.
 */
export type TypedCardVariant = "grid" | "row" | "mini" | "lead";

export function TypedCard({
  item,
  variant = "grid",
  className,
}: {
  item: TypedCardItem;
  variant?: TypedCardVariant;
  className?: string;
}) {
  const t = useTranslations("typedCards");
  const style = TYPE_STYLE[item.type];

  const eyebrow = (
    <span
      className="flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.12em]"
      style={{ color: style.color }}
    >
      <span className="size-2 rounded-full" style={{ background: style.color }} aria-hidden />
      {t(`type.${style.labelKey}`)}
    </span>
  );

  const title = (
    <span className={cn(item.quote && "before:me-0.5 before:content-['“'] after:ms-0.5 after:content-['”']")}>
      <bdi>{item.title || t("untitled")}</bdi>
    </span>
  );

  // Cover: real image, else the type-tinted blob placeholder.
  const cover = (h: string) => (
    <div className={cn("relative overflow-hidden", h)} style={blobStyle(style.color)}>
      {item.image && (
        <Image
          src={item.image}
          alt=""
          fill
          sizes="(max-width: 640px) 90vw, 320px"
          className="object-cover"
          placeholder={item.imageLqip ? "blur" : undefined}
          blurDataURL={item.imageLqip ?? undefined}
        />
      )}
      {item.type === "livedExperience" && (
        <span className="absolute inset-0 m-auto grid size-9 place-items-center rounded-full bg-white/90 shadow" aria-hidden>
          <Play className="size-4 fill-ccm-midnight text-ccm-midnight" />
        </span>
      )}
      {item.isNew && (
        <span className="absolute start-3 top-2.5 rounded-full bg-ccm-amber px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wider text-white">
          {t("new")}
        </span>
      )}
    </div>
  );

  const placeLine = item.place && (
    <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
      <MapPin className="size-3.5 flex-none" style={{ color: style.color }} aria-hidden />
      <bdi className="truncate">{item.place}</bdi>
    </span>
  );

  const docChips = item.docs && item.docs.length > 0 && (
    <span className="mt-2 flex flex-wrap gap-1.5">
      {item.docs.slice(0, 3).map((d) => (
        <span key={d} className="rounded-md border bg-background px-2 py-0.5 text-[11px] font-bold">
          {d}
        </span>
      ))}
      {item.docs.length > 3 && (
        <span className="rounded-md border bg-background px-2 py-0.5 text-[11px] font-bold">+{item.docs.length - 3}</span>
      )}
    </span>
  );

  const dateTile = item.event?.startAt && <DateTile iso={item.event.startAt} color={style.color} />;

  const avatar = item.person && (
    <span
      className="grid size-10 flex-none place-items-center overflow-hidden rounded-full font-heading text-sm font-extrabold text-white"
      style={{ background: `linear-gradient(135deg, ${TYPE_STYLE.person.color}, ${TYPE_STYLE.caseStudy.color})` }}
    >
      {item.person.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.person.image} alt="" className="size-full object-cover" />
      ) : (
        item.person.initials
      )}
    </span>
  );

  /* ── row (search results) ─────────────────────────────── */
  if (variant === "row") {
    const lead =
      item.type === "event" && dateTile ? (
        dateTile
      ) : item.type === "person" ? (
        avatar
      ) : item.type === "caseStudy" ? (
        <span className="grid w-6 flex-none place-items-center pt-1">
          <MapPin className="size-4" style={{ color: style.color }} aria-hidden />
        </span>
      ) : (
        <span className="relative block h-12 w-[72px] flex-none overflow-hidden rounded-lg">{cover("h-full w-full")}</span>
      );
    return (
      <Link
        href={item.href}
        className={cn("flex items-center gap-3.5 rounded-xl bg-card p-3.5 shadow-sm transition-shadow hover:shadow-md", className)}
      >
        {lead}
        <span className="min-w-0 flex-1">
          {eyebrow}
          <span className="mt-0.5 block truncate font-heading text-[15px] font-semibold leading-snug">{title}</span>
          {(item.meta || item.place) && (
            <span className="block truncate text-xs text-muted-foreground">
              <bdi>{item.meta ?? item.place}</bdi>
            </span>
          )}
        </span>
        {item.date && (
          <span className="flex-none text-[11.5px] text-muted-foreground">{shortDate(item.date)}</span>
        )}
      </Link>
    );
  }

  /* ── mini (bento cell) ────────────────────────────────── */
  if (variant === "mini") {
    return (
      <Link
        href={item.href}
        className={cn("flex flex-col overflow-hidden rounded-xl bg-card shadow-sm transition-shadow hover:shadow-md", className)}
      >
        {item.type === "livedExperience" && cover("h-11 flex-none")}
        <span className="flex flex-1 flex-col gap-1 px-4 py-3">
          {item.type === "event" && dateTile ? (
            <span className="flex items-center gap-2.5">
              {dateTile}
              {eyebrow}
            </span>
          ) : (
            eyebrow
          )}
          <span className="font-heading text-[13.5px] font-semibold leading-snug line-clamp-2">{title}</span>
          {docChips ||
            (item.meta || item.place ? (
              <span className="truncate text-[11.5px] text-muted-foreground">
                <bdi>{item.meta ?? item.place}</bdi>
              </span>
            ) : null)}
        </span>
      </Link>
    );
  }

  /* ── lead (bento editorial pick) ──────────────────────── */
  if (variant === "lead") {
    return (
      <Link
        href={item.href}
        className={cn("flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm transition-shadow hover:shadow-md", className)}
      >
        {cover("h-40 flex-none")}
        <span className="flex flex-1 flex-col gap-1.5 p-5">
          {eyebrow}
          <span className="font-heading text-lg font-semibold leading-snug text-balance">{title}</span>
          {item.excerpt && <span className="text-[13.5px] leading-relaxed text-muted-foreground line-clamp-3">{item.excerpt}</span>}
          <span className="mt-auto pt-2">{placeLine || (item.meta && <span className="text-xs text-muted-foreground"><bdi>{item.meta}</bdi></span>)}</span>
        </span>
      </Link>
    );
  }

  /* ── grid (default: Atlas panel, region sections) ─────── */
  return (
    <Link
      href={item.href}
      className={cn("flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm transition-shadow hover:shadow-md", className)}
    >
      {cover("h-[74px] flex-none")}
      <span className="flex flex-1 flex-col gap-1 px-4 pb-4 pt-3">
        {item.type === "event" && dateTile ? (
          <span className="flex items-center gap-2.5">
            {dateTile}
            {eyebrow}
          </span>
        ) : item.type === "person" ? (
          <span className="flex items-center gap-2.5">
            {avatar}
            {eyebrow}
          </span>
        ) : (
          eyebrow
        )}
        <span className="font-heading text-[15px] font-semibold leading-snug line-clamp-2">{title}</span>
        {placeLine}
        {docChips}
        {!item.place && !item.docs?.length && (item.meta || item.date) && (
          <span className="truncate text-xs text-muted-foreground">
            <bdi>{item.meta ?? shortDate(item.date!)}</bdi>
          </span>
        )}
      </span>
    </Link>
  );
}

function DateTile({ iso, color }: { iso: string; color: string }) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return (
    <span className="flex-none rounded-lg border bg-muted/40 px-2.5 py-1 text-center leading-tight" aria-hidden>
      <span className="block text-[9px] font-extrabold uppercase tracking-widest" style={{ color }}>
        {d.toLocaleDateString(undefined, { month: "short" })}
      </span>
      <span className="block font-heading text-[17px] font-bold tabular-nums">
        {d.toLocaleDateString(undefined, { day: "numeric" })}
      </span>
    </span>
  );
}

/** Type-tinted blob placeholder (the hub's illustration language, CSS-only). */
function blobStyle(color: string): React.CSSProperties {
  return {
    background: [
      `radial-gradient(90px 70px at 78% 18%, color-mix(in srgb, #90E0F4 45%, transparent), transparent 70%)`,
      `radial-gradient(140px 110px at 12% 88%, color-mix(in srgb, #9BC6DA 55%, transparent), transparent 72%)`,
      `linear-gradient(125deg, color-mix(in srgb, ${color} 88%, #06213f), #0B3160)`,
    ].join(", "),
  };
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
