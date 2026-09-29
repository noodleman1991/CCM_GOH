import "server-only";
import { Pencil } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getActor, isStaff } from "@/lib/authz";
import { documentEditHref } from "@/lib/cms/edit-links";

/** Staff-only "Edit this page" button at the top of a content page (editor-experience spec §3.1). */
export async function StaffEditLink({ collection, id, from }: { collection: string; id: string; from: string }) {
  if (!id || !isStaff(await getActor())) return null;
  const t = await getTranslations("blocks");
  return (
    <a
      href={documentEditHref(collection, id, from)}
      className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-ccm-sea/30 bg-white px-3 py-1 text-sm font-semibold text-ccm-sea hover:bg-ccm-sea/5"
    >
      <Pencil className="size-3.5" aria-hidden="true" />
      {t("editPage")}
    </a>
  );
}
