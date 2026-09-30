import { Pencil } from "lucide-react";

/**
 * Staff only (the caller decides): a small link from a section on the site to
 * that section in the admin (CMS project 2, spec §3.5). A plain `<a>` — the
 * admin lives outside the localized routes.
 *
 * It floats over the section's top corner and shows only while the section is
 * hovered or the link has keyboard focus, so it never takes space or covers
 * breadcrumbs (user, 2026-09-30). Devices without hover rely on the floating
 * "Edit this page" pill instead. The parent must carry `group/section relative`.
 */
export function SectionEditLink({ href, label }: { href: string; label: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 mx-auto hidden max-w-screen-xl justify-end px-4 pt-3 [@media(hover:hover)]:flex">
      <a
        href={href}
        className="pointer-events-auto inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white/95 px-3 text-sm font-bold text-ccm-sea opacity-0 shadow-md ring-1 ring-ccm-sea/20 transition-opacity group-hover/section:opacity-100 group-focus-within/section:opacity-100 hover:bg-white focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-ccm-sea"
      >
        <Pencil className="size-4" aria-hidden />
        {label}
      </a>
    </div>
  );
}
