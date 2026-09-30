"use client";

import { useEffect, useReducer, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RegionArtwork } from "@/components/regions/region-artwork";
import { carouselReducer, initialCarousel, shouldAdvance } from "@/lib/communities/carousel-state";
import type { RegionCode } from "@/lib/maps/region-codes";
import { cn } from "@/lib/utils";

/** One card, with every sentence already in the reader's language (built on the server). */
export interface TrackCard {
  slug: string;
  code: RegionCode;
  name: string;
  tagline: string | null;
  counts: string[];
  faces: Array<{ name: string; image: string }>;
  moreFaces: string | null;
  latest: string[];
  visitLabel: string;
  slideLabel: string;
  goToLabel: string;
}

const PERIOD = { calm: 6000, normal: 4000 } as const;
const LATEST_PERIOD = 5000;

const prefersReduced = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The Community carousel's moving part (regions-and-partners spec §3.3): one
 * line of equal cards. It advances on its own, pauses on hover and while the
 * tab is hidden, and stops for good once a visitor tabs in, taps or uses the
 * arrows. With reduced motion, or movement turned off by the editor, it
 * never moves and the latest line stays on its first item.
 */
export function CarouselTrack({
  cards,
  labels,
  autoplay,
  speed,
}: {
  cards: TrackCard[];
  labels: { region: string; previous: string; next: string };
  autoplay: boolean;
  speed: "calm" | "normal";
}) {
  const [state, dispatch] = useReducer(carouselReducer, cards.length, (n) => initialCarousel(n, !autoplay || prefersReduced()));
  const [cycle, bumpCycle] = useReducer((c: number) => c + 1, 0);
  const trackRef = useRef<HTMLDivElement>(null);
  const moving = shouldAdvance(state);

  useEffect(() => {
    if (!moving) return;
    const id = window.setInterval(() => dispatch({ type: "tick" }), PERIOD[speed]);
    return () => window.clearInterval(id);
  }, [moving, speed]);

  useEffect(() => {
    if (!moving) return;
    const id = window.setInterval(bumpCycle, LATEST_PERIOD);
    return () => window.clearInterval(id);
  }, [moving]);

  useEffect(() => {
    const onVisibility = () => dispatch({ type: document.hidden ? "pause" : "resume", reason: "hidden" });
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Bring the current card to the start of the row without moving the page.
  useEffect(() => {
    const track = trackRef.current;
    const card = track?.children[state.index] as HTMLElement | undefined;
    if (!track || !card) return;
    const rtl = getComputedStyle(track).direction === "rtl";
    const left = rtl ? card.offsetLeft + card.offsetWidth - track.clientWidth : card.offsetLeft;
    track.scrollTo({ left, behavior: prefersReduced() ? "auto" : "smooth" });
  }, [state.index]);

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={labels.region}
      onPointerEnter={(e) => e.pointerType === "mouse" && dispatch({ type: "pause", reason: "hover" })}
      onPointerLeave={(e) => e.pointerType === "mouse" && dispatch({ type: "resume", reason: "hover" })}
      onFocusCapture={() => dispatch({ type: "pause", reason: "focus" })}
      onTouchStart={() => dispatch({ type: "pause", reason: "touched" })}
    >
      <div
        ref={trackRef}
        className="relative flex snap-x snap-mandatory gap-3.5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {cards.map((card, i) => (
          <div
            key={card.slug}
            role="group"
            aria-roledescription="slide"
            aria-label={card.slideLabel}
            aria-current={i === state.index ? "true" : undefined}
            className="w-[82%] flex-none snap-start @content-sm/page:w-[45%] @content-lg/page:w-[31%] @content-xl/page:w-[23.5%]"
          >
            <CommunityCard card={card} line={card.latest.length ? card.latest[cycle % card.latest.length] : null} />
          </div>
        ))}
      </div>

      {cards.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => dispatch({ type: "prev" })}
            aria-label={labels.previous}
            className="inline-flex size-11 items-center justify-center rounded-full border border-ccm-sea/25 bg-white text-ccm-sea transition hover:bg-ccm-sea/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ccm-sea"
          >
            <ChevronLeft className="size-5 rtl:-scale-x-100" aria-hidden />
          </button>
          <div className="flex items-center gap-1">
            {cards.map((card, i) => (
              <button
                key={card.slug}
                type="button"
                onClick={() => dispatch({ type: "goto", index: i })}
                aria-label={card.goToLabel}
                aria-current={i === state.index ? "true" : undefined}
                className="inline-flex size-6 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-ccm-sea"
              >
                <span className={cn("block size-2 rounded-full transition-colors", i === state.index ? "bg-ccm-midnight" : "bg-ccm-sea/30")} />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => dispatch({ type: "next" })}
            aria-label={labels.next}
            className="inline-flex size-11 items-center justify-center rounded-full border border-ccm-sea/25 bg-white text-ccm-sea transition hover:bg-ccm-sea/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ccm-sea"
          >
            <ChevronRight className="size-5 rtl:-scale-x-100" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}

function CommunityCard({ card, line }: { card: TrackCard; line: string | null }) {
  return (
    <Link
      href={`/communities/${card.slug}`}
      aria-label={card.visitLabel}
      className="group flex h-full flex-col gap-3 rounded-2xl border border-ccm-midnight/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ccm-sea motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <RegionArtwork region={card.code} className="aspect-[16/10] rounded-xl" />
      <div className="space-y-1">
        <h3 className="font-heading text-lg font-bold leading-snug text-ccm-midnight group-hover:underline group-hover:underline-offset-2">
          <bdi>{card.name}</bdi>
        </h3>
        {card.tagline && <p className="line-clamp-2 text-sm text-ccm-midnight/75">{card.tagline}</p>}
      </div>
      {card.counts.length > 0 && (
        <p className="text-sm font-semibold text-ccm-sea">{card.counts.join(" · ")}</p>
      )}
      {(card.faces.length > 0 || card.moreFaces) && (
        <div className="flex items-center" aria-hidden>
          {card.faces.map((f) => (
            <Avatar key={f.image} className="-ms-2 size-8 ring-2 ring-white first:ms-0">
              <AvatarImage src={f.image} alt="" />
              <AvatarFallback className="text-xs">{f.name.slice(0, 1)}</AvatarFallback>
            </Avatar>
          ))}
          {card.moreFaces && (
            <span className="-ms-2 inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-ccm-sea/10 px-2 text-xs font-bold text-ccm-sea ring-2 ring-white">
              {card.moreFaces}
            </span>
          )}
        </div>
      )}
      {line && (
        <p aria-live="off" className="mt-auto line-clamp-2 min-h-10 border-t border-ccm-midnight/10 pt-3 text-sm text-ccm-midnight/80">
          {line}
        </p>
      )}
    </Link>
  );
}
