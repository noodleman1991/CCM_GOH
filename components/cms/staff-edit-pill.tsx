import { Pencil } from "lucide-react";

/**
 * Staff only (the caller decides): one floating "Edit this page" pill, bottom
 * corner, just above "Report a problem" — clear of breadcrumbs and page
 * content (user, 2026-09-30). A plain `<a>`: the admin lives outside the
 * localized routes.
 */
export function StaffEditPill({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] end-4 z-40 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-ccm-sea px-4 text-sm font-bold text-white shadow-lg ring-1 ring-white/30 transition hover:bg-ccm-midnight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ccm-sea print:hidden"
    >
      <Pencil className="size-4" aria-hidden />
      {label}
    </a>
  );
}
