'use client'

import { useState, useMemo } from 'react';
import type { PortableTextBlock } from '@portabletext/types';

export interface ReadMoreConfig {
  initiallyExpanded?: boolean;
}

export interface ReadMoreReturn {
  isExpanded: boolean;
  toggleExpanded: () => void;
  hasReadMoreBreak: boolean;
  contentBeforeBreak: PortableTextBlock[];
  contentAfterBreak: PortableTextBlock[];
  readMoreBreak?: PortableTextBlock;
}

/**
 * Custom hook for managing "Read More" functionality with Portable Text content
 * Finds readMore breaks and manages content truncation state
 */
export function useReadMore(
  content: PortableTextBlock[],
  config: ReadMoreConfig = {}
): ReadMoreReturn {
  const { initiallyExpanded = false } = config;
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

  const contentAnalysis = useMemo(() => {
    if (!content || !Array.isArray(content)) {
      return {
        hasReadMoreBreak: false,
        contentBeforeBreak: [],
        contentAfterBreak: [],
        readMoreBreak: undefined,
        readMoreIndex: -1,
      };
    }

    // Find the first readMore break
    const readMoreIndex = content.findIndex(
      (block) =>
        block._type === 'break' &&
        (block as any).style === 'readMore'
    );

    const hasReadMoreBreak = readMoreIndex !== -1;

    if (!hasReadMoreBreak) {
      return {
        hasReadMoreBreak: false,
        contentBeforeBreak: content,
        contentAfterBreak: [],
        readMoreBreak: undefined,
        readMoreIndex: -1,
      };
    }

    const readMoreBreak = content[readMoreIndex];
    const contentBeforeBreak = content.slice(0, readMoreIndex);
    const contentAfterBreak = content.slice(readMoreIndex + 1);

    return {
      hasReadMoreBreak,
      contentBeforeBreak,
      contentAfterBreak,
      readMoreBreak,
      readMoreIndex,
    };
  }, [content]);

  const toggleExpanded = () => setIsExpanded(prev => !prev);

  return {
    isExpanded,
    toggleExpanded,
    hasReadMoreBreak: contentAnalysis.hasReadMoreBreak,
    contentBeforeBreak: contentAnalysis.contentBeforeBreak,
    contentAfterBreak: contentAnalysis.contentAfterBreak,
    readMoreBreak: contentAnalysis.readMoreBreak,
  };
}

/**
 * Helper function to get the content that should be rendered based on read more state
 */
export function getVisibleContent(
  readMoreState: ReadMoreReturn
): PortableTextBlock[] {
  const {
    isExpanded,
    hasReadMoreBreak,
    contentBeforeBreak,
    contentAfterBreak
  } = readMoreState;

  if (!hasReadMoreBreak || isExpanded) {
    // Show all content if no read more break or if expanded
    return [...contentBeforeBreak, ...contentAfterBreak];
  }

  // Show only content before the break
  return contentBeforeBreak;
}
