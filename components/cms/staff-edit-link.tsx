import "server-only";
import { getTranslations } from "next-intl/server";
import { getActor, isStaff } from "@/lib/authz";
import { documentEditHref } from "@/lib/cms/edit-links";
import { StaffEditPill } from "@/components/cms/staff-edit-pill";

/** Staff-only "Edit this page" on a content page (editor-experience spec §3.1) — a floating pill, never in the breadcrumb row. */
export async function StaffEditLink({ collection, id, from }: { collection: string; id: string; from: string }) {
  if (!id || !isStaff(await getActor())) return null;
  const t = await getTranslations("blocks");
  return <StaffEditPill href={documentEditHref(collection, id, from)} label={t("editPage")} />;
}
