"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft, Plus, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlineText } from "@/components/ui/inline-text";
import PortableTextRenderer from "@/components/portable-text-renderer";
import PortableTextEditor from "@/components/forms/portable-text-editor";
import { createDoc, renameDoc, updateDocContent, deleteDoc } from "@/lib/actions/docs";
import { WorkspaceEmptyState } from "./workspace-empty-state";

type Doc = { id: string; title: string; content: unknown; updatedAt: string };

/**
 * Workspace documents (Notion-style). Editors get the TipTap → Portable Text
 * editor with debounced autosave; viewers/public get the read-only renderer.
 * Reuses the app's existing PortableTextEditor + PortableTextRenderer.
 */
export function WorkspaceDocs({
  collaborationId,
  initialDocs,
  canEdit,
}: {
  collaborationId: string;
  initialDocs: Doc[];
  canEdit: boolean;
}) {
  const t = useTranslations("docs");
  const tc = useTranslations("collaboration");
  const [docs, setDocs] = useState<Doc[]>(initialDocs);
  const [openId, setOpenId] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = docs.find((d) => d.id === openId) ?? null;

  const create = async () => {
    const res = await createDoc(collaborationId);
    if (!res.ok) { toast.error(res.error); return; }
    const doc: Doc = { id: res.docId, title: "Untitled", content: [], updatedAt: new Date().toISOString() };
    setDocs((d) => [...d, doc]);
    setOpenId(doc.id);
  };

  const rename = async (docId: string, title: string) => {
    setDocs((d) => d.map((x) => (x.id === docId ? { ...x, title } : x)));
    const res = await renameDoc(collaborationId, docId, title);
    if (!res.ok) toast.error(res.error);
  };

  const remove = async (docId: string) => {
    const res = await deleteDoc(collaborationId, docId);
    if (!res.ok) { toast.error(res.error); return; }
    setDocs((d) => d.filter((x) => x.id !== docId));
    if (openId === docId) setOpenId(null);
  };

  // Debounced autosave of the editor content (Notion-style — no Save button).
  const onContentChange = useCallback(
    (docId: string, content: unknown[]) => {
      setDocs((d) => d.map((x) => (x.id === docId ? { ...x, content } : x)));
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        const res = await updateDocContent(collaborationId, docId, content);
        if (!res.ok) toast.error(res.error);
      }, 800);
    },
    [collaborationId]
  );

  if (open) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setOpenId(null)}>
          <ArrowLeft className="size-4 me-2 rtl:-scale-x-100" />
          {t("backToDocs")}
        </Button>
        <InlineText
          value={open.title}
          onCommit={(next) => rename(open.id, next)}
          canEdit={canEdit}
          as="h2"
          placeholder={t("untitled")}
          className="text-xl font-heading font-semibold text-ccm-midnight"
          inputClassName="text-xl font-heading font-semibold"
        />
        {canEdit ? (
          <PortableTextEditor
            value={(open.content as unknown[]) ?? []}
            onChangeAction={(v) => onContentChange(open.id, v)}
            placeholder={t("startWriting")}
          />
        ) : (
          <div className="prose prose-sm max-w-none">
            <PortableTextRenderer value={(open.content as never) ?? []} />
          </div>
        )}
      </div>
    );
  }

  if (docs.length === 0) {
    return (
      <WorkspaceEmptyState
        icon={FileText}
        title={tc("emptyState.docsTitle")}
        body={tc("emptyState.docsBody")}
        action={
          canEdit ? (
            <Button variant="outline" onClick={create} className="gap-2">
              <Plus className="size-4" />
              {t("newDoc")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      <ul className="divide-y rounded-lg border">
        {docs.map((d) => (
          <li key={d.id} className="flex items-center gap-3 p-4 hover:bg-muted/50">
            <FileText className="size-4 flex-shrink-0 text-ccm-sea" aria-hidden="true" />
            <button onClick={() => setOpenId(d.id)} className="min-w-0 flex-1 text-start font-medium">
              <bdi>{d.title}</bdi>
            </button>
            {canEdit && (
              <button onClick={() => remove(d.id)} aria-label={t("deleteDoc")} className="text-muted-foreground hover:text-destructive">
                <X className="size-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>
      {canEdit && (
        <Button variant="outline" onClick={create} className="gap-2">
          <Plus className="size-4" />
          {t("newDoc")}
        </Button>
      )}
    </div>
  );
}
