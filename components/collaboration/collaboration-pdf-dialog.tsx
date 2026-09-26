"use client";

import dynamic from "next/dynamic";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";

const PdfViewer = dynamic(() => import("@/components/pdf/pdf-viewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[70dvh] items-center justify-center" aria-busy="true">
      <span className="size-5 animate-spin rounded-full border-2 border-muted-foreground/40 border-t-transparent" />
    </div>
  ),
});

export function CollaborationPdfDialog({
  open,
  onOpenChange,
  fileId,
  fileName,
  url,
  canAnnotate,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  fileId: string;
  fileName: string;
  url: string;
  canAnnotate: boolean;
  isSignedIn: boolean;
}) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={<span className="block truncate text-base"><bdi>{fileName}</bdi></span>}
      className="sm:max-w-5xl"
      bodyClassName="p-0 sm:p-0 [&>[data-slot=drawer-header]]:border-b [&>[data-slot=drawer-header]]:px-4 [&>[data-slot=dialog-header]]:border-b [&>[data-slot=dialog-header]]:px-4 [&>[data-slot=dialog-header]]:py-3"
    >
      <PdfViewer url={url} fileId={fileId} canAnnotate={canAnnotate} />
    </ResponsiveDialog>
  );
}
