import { Pencil } from "lucide-react";

/**
 * Staff only (the caller decides): a small link from a section on the site to
 * that section in the admin (CMS project 2, spec §3.5). A plain `<a>` — the
 * admin lives outside the localized routes.
 */
export function SectionEditLink({ href, label }: { href: string; label: string }) {
  return (
    <div className="pointer-events-none relative z-10 mx-auto flex max-w-screen-xl justify-end px-4">
      <a
        href={href}
        className="pointer-events-auto -mb-11 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white/90 px-3 text-sm font-bold text-ccm-sea shadow-sm ring-1 ring-ccm-sea/20 hover:bg-white focus-visible:outline-2 focus-visible:outline-ccm-sea"
      >
        <Pencil className="size-4" aria-hidden />
        {label}
      </a>
    </div>
  );
}
