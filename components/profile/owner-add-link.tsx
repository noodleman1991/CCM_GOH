import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";

/**
 * Where an empty section would be, the owner gets one gentle way to fill it
 * (profile spec D3). Visitors never see an empty section, so never this.
 */
export function OwnerAddLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="flex min-h-16 items-center gap-3 rounded-2xl border border-dashed border-ccm-midnight/20 bg-white p-4 text-sm font-semibold text-ccm-midnight transition-colors hover:border-ccm-sea/50 hover:bg-ccm-sky/10"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ccm-sky/25 text-ccm-sea" aria-hidden>
        <Plus className="size-4" />
      </span>
      <span className="text-pretty">{children}</span>
    </Link>
  );
}

/** One chapter of a profile: an anchor the section menu scrolls to, a heading, its content. */
export function ProfileSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-14 space-y-4">
      <h2 id={`${id}-title`} className="font-heading text-2xl font-bold text-ccm-midnight">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** A small label over a group inside a section ("Looking for", "Skills"…). */
export function SubHeading({ children }: { children: ReactNode }) {
  return <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-ccm-sea">{children}</h3>;
}
