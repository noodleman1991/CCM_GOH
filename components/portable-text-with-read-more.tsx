'use client';

import { useState } from 'react';
import { PortableText, PortableTextComponents } from '@portabletext/react';
import type { PortableTextBlock } from '@portabletext/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PortableTextWithReadMoreProps {
  contentBeforeBreak: PortableTextBlock[];
  contentAfterBreak: PortableTextBlock[];
  components: PortableTextComponents;
  locale?: string;
  isRTL?: boolean;
}

/**
 * Client component that handles read-more toggle functionality
 * Receives pre-split content from server component
 */
export function PortableTextWithReadMore({
  contentBeforeBreak,
  contentAfterBreak,
  components,
  locale = 'en',
  isRTL = false,
}: PortableTextWithReadMoreProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldUseRTL = isRTL || locale === 'ar';

  const visibleContent = isExpanded
    ? [...contentBeforeBreak, ...contentAfterBreak]
    : contentBeforeBreak;

  const readMoreLabel =
    locale === 'ar' ? 'اقرأ المزيد' :
    locale === 'es' ? 'Leer más' :
    locale === 'fr' ? 'Lire la suite' :
    'Read More';

  const showLessLabel =
    locale === 'ar' ? 'عرض أقل' :
    locale === 'es' ? 'Mostrar menos' :
    locale === 'fr' ? 'Montrer moins' :
    'Show Less';

  return (
    <>
      <PortableText value={visibleContent} components={components} />
      <div className="mt-8 text-center">
        <Button
          variant="invert"
          size="wide"
          stroke="light"
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'transition-all duration-200 hover:scale-105 font-body',
            shouldUseRTL && 'font-arabic-heading'
          )}
        >
          {isExpanded ? showLessLabel : readMoreLabel}
        </Button>
      </div>
    </>
  );
}
