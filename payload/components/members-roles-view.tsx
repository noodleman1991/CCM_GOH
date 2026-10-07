import Link from "next/link";
import { DefaultTemplate } from "@payloadcms/next/templates";
import type { AdminViewServerProps, ServerProps } from "payload";
import { MembersRolesPanel } from "./members-roles-panel";

/**
 * Settings → Members & roles (dashboard/profile spec D6), at /admin/members.
 *
 * The admin's own Users list only mirrors people who have signed into the
 * admin, so it can't be used to give someone a role. This page searches every
 * member of the hub — by name or username, never showing an email — and lets
 * an admin change a role with a confirm step. Admins only: the page checks the
 * signed-in role here, and the server actions check it again on every call.
 *
 * Imports pure modules and server actions only (payload-admin-client-import-gotcha).
 */
export function MembersRolesView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, visibleEntities } = initPageResult;
  const isAdmin = (req.user as { role?: string } | null)?.role === "admin";

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={req.user ?? undefined}
      visibleEntities={visibleEntities}
    >
      <div className="gutter--left gutter--right" style={{ paddingBlock: "2rem", maxWidth: "56rem" }}>
        <h1 style={{ margin: "0 0 0.5rem" }}>Members &amp; roles</h1>
        {isAdmin ? (
          <MembersRolesPanel />
        ) : (
          <div className="ccm-card">
            <p style={{ margin: 0 }}>Only admins can change members&apos; roles. Ask an admin if someone needs a different role.</p>
          </div>
        )}
      </div>
    </DefaultTemplate>
  );
}

/** "Members & roles" in the side panel — shown to admins only. */
export function MembersNavLink({ user }: ServerProps) {
  if ((user as { role?: string } | null | undefined)?.role !== "admin") return null;
  return (
    <Link href="/admin/members" className="nav__link" style={{ display: "block", padding: "0.35rem 0", fontWeight: 600 }}>
      Members &amp; roles
    </Link>
  );
}
