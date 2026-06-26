"use client";

import { useRef, useState } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Trash2, FileType } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { confirmFileUpload, deleteFile } from "@/lib/actions/collaboration-files";
import { cn } from "@/lib/utils";
import { WorkspaceEmptyState } from "./workspace-empty-state";
import type { CollaborationRole } from "@/generated/prisma";

type FileRow = {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  createdAt: string;
  uploadedById: string;
  url: string | null;
  isPdf: boolean;
};

const fetcher = (url: string) =>
  fetch(url).then((r) => (r.ok ? (r.json() as Promise<{ files: FileRow[] }>) : { files: [] }));

function humanSize(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1_048_576) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1_048_576).toFixed(1)} MB`;
}

export function WorkspaceFiles({
  collaborationId,
  myRole,
  onOpenPdf,
}: {
  collaborationId: string;
  myRole: CollaborationRole | null;
  onOpenPdf: (file: FileRow) => void;
}) {
  const t = useTranslations("collaboration");
  const { data, mutate } = useSWR(`/api/collaborations/${collaborationId}/files`, fetcher, {
    revalidateOnFocus: false,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const canUpload = myRole === "EDITOR" || myRole === "OWNER";
  const files = data?.files ?? [];

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      // 1. presign
      const presignRes = await fetch(`/api/collaborations/${collaborationId}/files/presign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, size: file.size }),
      });
      if (!presignRes.ok) {
        const e = await presignRes.json().catch(() => ({}));
        toast.error(e.error ?? t("uploadFailed"));
        return;
      }
      const { key, url } = await presignRes.json();
      // 2. PUT to R2
      const put = await fetch(url, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!put.ok) {
        toast.error(t("uploadFailed"));
        return;
      }
      // 3. confirm
      const confirm = await confirmFileUpload({
        collaborationId,
        key,
        fileName: file.name,
        contentType: file.type,
        size: file.size,
      });
      if (!confirm.ok) {
        toast.error(confirm.error);
        return;
      }
      toast.success(t("uploaded"));
      mutate();
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async (id: string) => {
    const res = await deleteFile(collaborationId, id);
    if (res.ok) mutate();
    else toast.error(res.error);
  };

  return (
    <div
      className="space-y-4"
      onDragOver={canUpload ? (e) => { e.preventDefault(); setDragOver(true); } : undefined}
      onDragLeave={canUpload ? () => setDragOver(false) : undefined}
      onDrop={
        canUpload
          ? (e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFile(file);
            }
          : undefined
      }
    >
      {canUpload && (
        <div
          className={cn(
            "rounded-lg border border-dashed p-4 text-center transition-colors",
            dragOver ? "border-ccm-sea bg-ccm-sky/10" : "border-input"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <p className="mb-2 text-sm text-muted-foreground">{t("dropToUpload")}</p>
          <Button variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
            <Upload className="size-4 me-2" />
            {uploading ? t("uploading") : t("uploadFile")}
          </Button>
        </div>
      )}

      {files.length === 0 ? (
        <WorkspaceEmptyState
          icon={FileText}
          title={t("emptyState.filesTitle")}
          body={t("emptyState.filesBody")}
        />
      ) : (
        <ul className="divide-y rounded-lg border">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 p-3">
              {f.isPdf ? (
                <FileType className="size-5 flex-shrink-0 text-ccm-sea" aria-hidden="true" />
              ) : (
                <FileText className="size-5 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  <bdi>{f.fileName}</bdi>
                </p>
                <p className="text-xs text-muted-foreground">
                  {humanSize(f.size)} · {formatDistanceToNow(new Date(f.createdAt), { addSuffix: true })}
                </p>
              </div>
              {f.isPdf ? (
                <Button size="sm" variant="ghost" onClick={() => onOpenPdf(f)}>
                  {t("openPdf")}
                </Button>
              ) : f.url ? (
                <Button size="sm" variant="ghost" asChild>
                  <a href={f.url} target="_blank" rel="noopener noreferrer">
                    {t("download")}
                  </a>
                </Button>
              ) : null}
              {canUpload && (
                <button onClick={() => remove(f.id)} className="text-muted-foreground hover:text-destructive" aria-label={t("delete")}>
                  <Trash2 className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
