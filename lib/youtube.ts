const YT = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube(?:-nocookie)?\.com\/embed\/)([\w-]{11})/;

/** Extract a YouTube video id from a URL (only YouTube allowed in v1). */
export function youtubeId(url: string): string | null {
  const m = url.match(YT);
  return m ? m[1] : null;
}
