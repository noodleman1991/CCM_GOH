"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { Check, CloudOff, Eye, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type DraftStatus = 'idle' | 'saving' | 'saved' | 'error';

interface SubmitBarProps {
    draftStatus: DraftStatus;
    draftSavedAt: string | null;
    incomplete: boolean;
    isSubmitting: boolean;
    onSaveDraft: () => void;
    onPreview: () => void;
    onSubmit: () => void;
}

/**
 * Task E3 — sticky bottom bar: autosaved-draft indicator (fed by the existing
 * /api/case-studies/drafts autosave) + Preview (the existing review step) +
 * "Submit for review". Sticky within the page flow; bottom offset respects
 * the mobile safe area.
 */
export function SubmitBar({
    draftStatus,
    draftSavedAt,
    incomplete,
    isSubmitting,
    onSaveDraft,
    onPreview,
    onSubmit,
}: SubmitBarProps) {
    const t = useTranslations('caseStudySubmission.bar');

    const indicator = (() => {
        switch (draftStatus) {
            case 'saving':
                return (
                    <>
                        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
                        <span className="truncate">{t('saving')}</span>
                    </>
                );
            case 'saved':
                return (
                    <>
                        <Check className="h-3.5 w-3.5 shrink-0 text-green-600" aria-hidden="true" />
                        <span className="truncate">
                            {draftSavedAt ? t('savedAt', { time: draftSavedAt }) : t('saved')}
                        </span>
                    </>
                );
            case 'error':
                return (
                    <>
                        <CloudOff className="h-3.5 w-3.5 shrink-0 text-ccm-amber" aria-hidden="true" />
                        <span className="truncate">{t('saveError')}</span>
                    </>
                );
            default:
                return <span className="truncate">{t('notSaved')}</span>;
        }
    })();

    return (
        <div className="sticky bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mt-10">
            <div className="flex items-center gap-3 rounded-2xl border bg-background/95 px-4 py-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/85">
                <p
                    className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-muted-foreground"
                    aria-live="polite"
                >
                    {indicator}
                </p>
                <Button
                    type="button"
                    variant="ghost"
                    className="hidden min-h-11 sm:inline-flex"
                    onClick={onSaveDraft}
                >
                    {t('saveDraft')}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    onClick={onPreview}
                >
                    <Eye className="h-4 w-4 sm:me-2" aria-hidden="true" />
                    <span className="sr-only sm:not-sr-only">{t('preview')}</span>
                </Button>
                <Button
                    type="button"
                    className="min-h-11"
                    onClick={onSubmit}
                    disabled={isSubmitting || incomplete}
                    title={incomplete ? t('incomplete') : undefined}
                >
                    <Send className="me-2 h-4 w-4" aria-hidden="true" />
                    {t('submit')}
                </Button>
            </div>
        </div>
    );
}
