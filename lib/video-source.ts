import { youtubeId } from "@/lib/youtube";
import { vimeoId } from "@/lib/vimeo";

export type VideoSource = "youtube" | "vimeo" | "upload";

const SOURCES: VideoSource[] = ["youtube", "vimeo", "upload"];

/**
 * Resolve which player a lived experience should render.
 * Precedence: an explicit (valid) `videoSource` wins → an uploaded file
 * → whatever the legacy URL parses as (YouTube / Vimeo) → null.
 * Legacy docs carry only a URL and no `videoSource`, so derivation keeps
 * them working unchanged.
 */
export function deriveVideoSource(
  videoSource?: string | null,
  videoUrl?: string | null,
  videoFileUrl?: string | null
): VideoSource | null {
  if (videoSource && (SOURCES as string[]).includes(videoSource)) {
    return videoSource as VideoSource;
  }
  if (videoFileUrl) return "upload";
  if (videoUrl) {
    if (youtubeId(videoUrl)) return "youtube";
    if (vimeoId(videoUrl)) return "vimeo";
  }
  return null;
}
