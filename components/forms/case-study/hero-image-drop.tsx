"use client";

import React, { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ImagePlus, RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeroImageDropProps {
    previewUrl: string | null;
    /** Receives the raw File; validation (type/size) stays with the caller. */
    onFile: (file: File) => void;
    onRemove: () => void;
}

/**
 * Task E3 — hero-image drop zone. A dashed zone that becomes the image once a
 * file is picked, with a replace/remove affordance (always visible on touch,
 * hover-revealed on pointer devices). Reuses the form's existing upload
 * state/plumbing — the File is still uploaded only at final submit.
 */
export function HeroImageDrop({ previewUrl, onFile, onRemove }: HeroImageDropProps) {
    const t = useTranslations('caseStudySubmission.hero');
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);

    const handleFiles = (files: FileList | null) => {
        const file = files?.[0];
        if (file) onFile(file);
    };

    return (
        <div>
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                    handleFiles(e.target.files);
                    e.target.value = ''; // allow re-selecting the same file
                }}
                aria-hidden="true"
                tabIndex={-1}
            />

            {previewUrl ? (
                <div className="group relative overflow-hidden rounded-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element -- local data-URL preview */}
                    <img
                        src={previewUrl}
                        alt={t('previewAlt')}
                        className="h-52 w-full object-cover sm:h-64 md:h-80"
                    />
                    <div className="absolute inset-0 flex items-end justify-end gap-2 bg-gradient-to-t from-black/40 via-transparent to-transparent p-3 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="flex min-h-11 items-center gap-2 rounded-full bg-background/90 px-4 py-2 text-sm font-medium text-ccm-midnight shadow-sm backdrop-blur transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ccm-water"
                        >
                            <RefreshCw className="h-4 w-4" aria-hidden="true" />
                            {t('replace')}
                        </button>
                        <button
                            type="button"
                            onClick={onRemove}
                            aria-label={t('remove')}
                            className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-background/90 text-ccm-midnight shadow-sm backdrop-blur transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ccm-water"
                        >
                            <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setDragging(false);
                        handleFiles(e.dataTransfer.files);
                    }}
                    className={cn(
                        'flex h-44 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ccm-water sm:h-56',
                        dragging
                            ? 'border-ccm-water bg-ccm-water/5'
                            : 'border-border hover:border-ccm-water/60 hover:bg-muted/30'
                    )}
                >
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-ccm-water/10 text-ccm-water">
                        <ImagePlus className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-medium text-ccm-midnight">{t('dropHint')}</span>
                    <span className="text-xs text-muted-foreground">{t('formats')}</span>
                </button>
            )}
        </div>
    );
}
