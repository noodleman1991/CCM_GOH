"use client";

/**
 * Shared PDF viewer (EmbedPDF). Calm chrome matching the hub; annotations are
 * OFF by default — a single quiet "Notes" toggle reveals the annotation tools.
 * Uses the 2.x document-manager loader (NOT the legacy plugin-loader). The
 * pdfium engine resolves via usePdfiumEngine.
 */

import { useState } from "react";
import { usePdfiumEngine } from "@embedpdf/engines/react";
import { EmbedPDF } from "@embedpdf/core/react";
import { createPluginRegistration } from "@embedpdf/core";
import { DocumentManagerPluginPackage } from "@embedpdf/plugin-document-manager";
import { ViewportPluginPackage } from "@embedpdf/plugin-viewport";
import { Viewport } from "@embedpdf/plugin-viewport/react";
import { ScrollPluginPackage } from "@embedpdf/plugin-scroll";
import { Scroller } from "@embedpdf/plugin-scroll/react";
import { RenderPluginPackage } from "@embedpdf/plugin-render";
import { RenderLayer } from "@embedpdf/plugin-render/react";
import { AnnotationPluginPackage } from "@embedpdf/plugin-annotation";
import { AnnotationLayer, useAnnotationCapability } from "@embedpdf/plugin-annotation/react";
import { useEffect, useRef as useReactRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { loadAnnotations, saveAnnotations } from "@/lib/actions/collaboration-annotations";

/**
 * Persists EmbedPDF annotations to CollaborationFileAnnotations: imports the
 * saved blob on mount, debounce-saves the export on any annotation event.
 * Rendered inside <EmbedPDF> so the capability hook has a registry.
 */
function AnnotationPersistence({ fileId, canAnnotate }: { fileId: string; canAnnotate: boolean }) {
  const { provides: annotation } = useAnnotationCapability();
  const saveTimer = useReactRef<ReturnType<typeof setTimeout> | null>(null);
  const importedRef = useReactRef(false);

  useEffect(() => {
    if (!annotation) return;

    // Load saved annotations once.
    if (!importedRef.current) {
      importedRef.current = true;
      loadAnnotations(fileId).then((res) => {
        if (res.ok && res.data && annotation.importAnnotations) {
          try {
            annotation.importAnnotations(res.data as never);
          } catch {
            /* ignore malformed legacy blobs */
          }
        }
      });
    }

    if (!canAnnotate || !annotation.onAnnotationEvent) return;
    const unsubscribe = annotation.onAnnotationEvent(() => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          const task = annotation.exportAnnotations?.();
          const data = task && "toPromise" in task ? await (task as { toPromise: () => Promise<unknown> }).toPromise() : await task;
          if (data !== undefined) await saveAnnotations(fileId, data);
        } catch {
          /* best-effort */
        }
      }, 1500);
    });
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      unsubscribe?.();
    };
  }, [annotation, fileId, canAnnotate]);

  return null;
}

export default function PdfViewer({
  url,
  fileId,
  canAnnotate,
}: {
  url: string;
  fileId: string;
  canAnnotate: boolean;
}) {
  const t = useTranslations("collaboration");
  const { engine, isLoading } = usePdfiumEngine();
  const [notes, setNotes] = useState(false);

  if (isLoading || !engine) {
    return <div className="flex h-[70vh] items-center justify-center text-sm text-muted-foreground">{t("loadingPdf")}</div>;
  }

  const DOC_ID = "doc";
  const plugins = [
    createPluginRegistration(DocumentManagerPluginPackage, {
      initialDocuments: [{ documentId: DOC_ID, url }],
    }),
    createPluginRegistration(ViewportPluginPackage),
    createPluginRegistration(ScrollPluginPackage),
    createPluginRegistration(RenderPluginPackage),
    // Always registered: annotations are a SHARED per-file layer, so read-only
    // roles (VIEWER, public visitors on PUBLIC workspaces) must still see them.
    // Editing stays gated: the save handler only attaches when canAnnotate, and
    // the server rejects non-annotators anyway (collab:annotate).
    createPluginRegistration(AnnotationPluginPackage),
  ];

  return (
    <div className="flex h-[75vh] flex-col">
      <div className="flex items-center justify-end border-b px-2 py-1.5">
        <Button
          variant={notes ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setNotes((v) => !v)}
          aria-pressed={notes}
        >
          {notes ? t("notesOn") : t("notesOff")}
        </Button>
      </div>
      <div className="min-h-0 flex-1 bg-muted">
        <EmbedPDF engine={engine} plugins={plugins}>
          <AnnotationPersistence fileId={fileId} canAnnotate={canAnnotate} />
          <Viewport documentId={DOC_ID} className="h-full w-full">
            <Scroller
              documentId={DOC_ID}
              renderPage={({ pageIndex, width, height }) => (
                <div style={{ width, height, position: "relative" }}>
                  <RenderLayer documentId={DOC_ID} pageIndex={pageIndex} />
                  {notes && <AnnotationLayer documentId={DOC_ID} pageIndex={pageIndex} />}
                </div>
              )}
            />
          </Viewport>
        </EmbedPDF>
      </div>
    </div>
  );
}
