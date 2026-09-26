import { CCM } from "@/lib/ccm-colors";

/**
 * Task 13 typed-card identity system (approved mock v3): every content type
 * has ONE colour + ONE i18n label + ONE signature element, reused verbatim
 * across the Atlas panel, search rows, homepage bento and region sections.
 *
 * Colours extend the atlas layer palette (lib/ccm-colors.ts COLOR.layer) to
 * the three types that never had a layer (event/person/region get the values
 * fixed in the approved mock).
 */
export type TypedCardType =
  | "caseStudy"
  | "livedExperience"
  | "newsPost"
  | "researchOutput"
  | "event"
  | "person"
  | "region";

export const TYPE_STYLE: Record<TypedCardType, { color: string; labelKey: string }> = {
  caseStudy: { color: CCM.sea, labelKey: "caseStudy" },
  livedExperience: { color: CCM.water, labelKey: "livedExperience" },
  newsPost: { color: CCM.amber, labelKey: "newsPost" },
  researchOutput: { color: CCM.midnight, labelKey: "researchOutput" },
  event: { color: "#3D8FA8", labelKey: "event" },
  person: { color: "#6E9BC0", labelKey: "person" },
  region: { color: "#2C7A5B", labelKey: "region" },
};

export function isTypedCardType(v: string): v is TypedCardType {
  return v in TYPE_STYLE;
}

/** The normalized item every surface adapts its raw data into. */
export interface TypedCardItem {
  type: TypedCardType;
  id: string;
  title: string;
  href: string;
  excerpt?: string | null;
  image?: string | null;
  imageLqip?: string | null;
  /** Case studies: the place line (their signature). */
  place?: string | null;
  /** Generic secondary line (person role·city, LE person context, news source). */
  meta?: string | null;
  date?: string | null;
  chips?: string[];
  /** Research outputs: document chips, e.g. "Full report · EN". */
  docs?: string[];
  /** Events: the date-tile + status line. */
  event?: { startAt: string | null; going?: number | null; mode?: string | null };
  /** People: avatar. */
  person?: { initials: string; image?: string | null };
  /** LE: quoted title + video-first cover. */
  quote?: boolean;
  isNew?: boolean;
}
