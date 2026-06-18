"use client";

import dynamic from "next/dynamic";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const PdfViewer = dynamic(() => import("@/components/pdf/pdf-viewer"), {
  ssr: false,
  loading: () => <div className="flex h-[70vh] items-center justify-center text-sm text-muted-foreground">…</div>,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0">
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle className="truncate text-base">
            <bdi>{fileName}</bdi>
          </DialogTitle>
        </DialogHeader>
        <PdfViewer url={url} fileId={fileId} canAnnotate={canAnnotate} />
      </DialogContent>
    </Dialog>
  );
}
