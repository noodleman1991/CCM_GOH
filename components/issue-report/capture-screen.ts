/**
 * "Capture this page" for the issue reporter, through the browser's own screen
 * capture. It sees exactly what the reporter sees (maps, embeds, video),
 * which a DOM-to-canvas library cannot, at the cost of a permission prompt.
 * Phones and tablets have no getDisplayMedia, so the button is hidden there.
 */

const MAX_EDGE = 2560;

export function canCaptureScreen(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.mediaDevices?.getDisplayMedia === "function";
}

/** True when the reporter dismissed the browser's share prompt: not an error. */
export function isCaptureCancelled(error: unknown): boolean {
  const name = (error as { name?: unknown } | null)?.name;
  return name === "NotAllowedError" || name === "AbortError";
}

/** Resolves once the browser has painted, so a just-closed panel is really gone. */
export function afterNextPaint(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame !== "function") return void setTimeout(resolve, 0);
    requestAnimationFrame(() => setTimeout(resolve, 0));
  });
}

export function captureFilename(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `screenshot-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}.jpg`;
}

/** The scale for each encoding attempt: fit the longest edge, then shrink by a quarter each retry. */
export function captureScales(width: number, height: number, attempts = 5): number[] {
  const first = Math.min(1, MAX_EDGE / Math.max(width, height, 1));
  return Array.from({ length: attempts }, (_, i) => first * 0.75 ** i);
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function captureCurrentTab(maxBytes: number): Promise<File> {
  // preferCurrentTab / selfBrowserSurface steer Chrome's picker to this tab;
  // other browsers ignore the keys they do not know.
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: { displaySurface: "browser" },
    audio: false,
    preferCurrentTab: true,
    selfBrowserSurface: "include",
    surfaceSwitching: "exclude",
  } as DisplayMediaStreamOptions);
  try {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;
    await video.play();
    // Let the report panel finish closing and the share prompt clear first.
    await wait(600);

    for (const scale of captureScales(video.videoWidth, video.videoHeight)) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
      canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
      canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
      if (blob && blob.size <= maxBytes) return new File([blob], captureFilename(), { type: "image/jpeg" });
    }
    throw new Error("The captured screenshot is too large.");
  } finally {
    stream.getTracks().forEach((track) => track.stop());
  }
}
