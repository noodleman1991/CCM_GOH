import type { PortableTextBlock } from '@portabletext/types';

export interface ContentSplit {
  hasReadMoreBreak: boolean;
  contentBeforeBreak: PortableTextBlock[];
  contentAfterBreak: PortableTextBlock[];
  readMoreIndex: number;
}

/**
 * Server-side utility to analyze and split PortableText content at read-more breaks
 * This runs on the server and doesn't require client-side state
 */
export function splitContentAtReadMore(
  content: PortableTextBlock[] | undefined | null
): ContentSplit {
  if (!content || !Array.isArray(content)) {
    return {
      hasReadMoreBreak: false,
      contentBeforeBreak: [],
      contentAfterBreak: [],
      readMoreIndex: -1,
    };
  }

  // Find the first readMore break
  const readMoreIndex = content.findIndex(
    (block) =>
      block._type === 'break' && (block as { style?: string }).style === 'readMore'
  );

  const hasReadMoreBreak = readMoreIndex !== -1;

  if (!hasReadMoreBreak) {
    return {
      hasReadMoreBreak: false,
      contentBeforeBreak: content,
      contentAfterBreak: [],
      readMoreIndex: -1,
    };
  }

  const contentBeforeBreak = content.slice(0, readMoreIndex);
  const contentAfterBreak = content.slice(readMoreIndex + 1);

  return {
    hasReadMoreBreak,
    contentBeforeBreak,
    contentAfterBreak,
    readMoreIndex,
  };
}

/**
 * Get the visible content based on whether content is expanded
 * Server-friendly version that doesn't use hooks
 */
export function getVisibleContent(
  split: ContentSplit,
  isExpanded: boolean
): PortableTextBlock[] {
  if (!split.hasReadMoreBreak || isExpanded) {
    return [...split.contentBeforeBreak, ...split.contentAfterBreak];
  }
  return split.contentBeforeBreak;
}
