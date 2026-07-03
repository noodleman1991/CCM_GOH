"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { SquarePlay, Trash2 } from "lucide-react";
import { youtubeId } from "@/lib/youtube";
import { cn } from "@/lib/utils";

/** Tiptap NodeView for the YouTube block: URL input -> parsed id + thumbnail preview + caption. */
export function YoutubeView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const t = useTranslations("editor");
  const { videoId, caption } = node.attrs as { videoId: string; caption: string };
  const [urlDraft, setUrlDraft] = useState("");
  const [error, setError] = useState(false);

  const handleUrlSubmit = () => {
    const id = youtubeId(urlDraft.trim());
    if (!id) {
      setError(true);
      return;
    }
    setError(false);
    updateAttributes({ videoId: id });
  };

  return (
    <NodeViewWrapper className="my-4" data-drag-handle>
      <div
        className={cn(
          "group relative rounded-xl border p-3",
          selected ? "border-ccm-water ring-2 ring-ccm-water/40" : "border-border"
        )}
      >
        <button
          type="button"
          aria-label={t("toolbar.delete")}
          onClick={() => deleteNode()}
          className="absolute end-2 top-2 z-10 flex size-11 items-center justify-center rounded-md bg-ccm-midnight text-white/70 opacity-0 transition-opacity hover:text-white group-hover:opacity-100"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>

        {videoId ? (
          <div className="space-y-2">
            <div className="relative mx-auto aspect-video max-w-[32rem] overflow-hidden rounded-lg bg-ccm-midnight">
              {/* eslint-disable-next-line @next/next/no-img-element -- editor-only preview thumbnail */}
              <img
                src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
                alt=""
                className="size-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <SquarePlay className="size-12 text-white/90" aria-hidden="true" />
              </div>
            </div>
            <label className="block">
              <span className="sr-only">{t("youtube.captionLabel")}</span>
              <input
                type="text"
                value={caption || ""}
                onChange={(e) => updateAttributes({ caption: e.target.value })}
                placeholder={t("youtube.captionPlaceholder")}
                className="w-full min-h-[44px] rounded-md border bg-background px-3 text-sm italic text-muted-foreground"
              />
            </label>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={urlDraft}
              onChange={(e) => {
                setUrlDraft(e.target.value);
                setError(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleUrlSubmit();
                }
              }}
              placeholder={t("youtube.urlPlaceholder")}
              aria-invalid={error}
              className="min-h-[44px] flex-1 rounded-md border bg-background px-3 text-sm"
            />
            <button
              type="button"
              onClick={handleUrlSubmit}
              className="min-h-[44px] rounded-md bg-ccm-water px-4 text-sm font-medium text-white hover:bg-ccm-sea"
            >
              {t("youtube.confirm")}
            </button>
          </div>
        )}
        {error && <p className="mt-2 text-xs text-destructive">{t("youtube.invalidUrl")}</p>}
      </div>
    </NodeViewWrapper>
  );
}
