"use server";

import { revalidateTag, updateTag } from "next/cache";
import { parseTags } from "next-sanity/live";

import { draftMode } from "next/headers";

export async function revalidateTags(unsafeTags: unknown) {
  const { isEnabled: isDraftMode } = await draftMode();
  const { tags } = parseTags(unsafeTags);
  const logTags: string[] = [];
  for (const tag of tags) {
    if (isDraftMode) {
      revalidateTag(tag, "max");
    } else {
      updateTag(tag);
    }
    logTags.push(tag);
  }

  console.log(
    `<SanityLive /> ${isDraftMode ? `revalidated tags: ${logTags.join(", ")} with cache profile "max" ` : `updated tags: ${logTags.join(", ")}`}`,
  );

  if (isDraftMode) {
    return "refresh";
  }
}
