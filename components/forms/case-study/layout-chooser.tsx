"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { BookOpen, Image as ImageIcon, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CaseStudyLayout = 'story' | 'feature' | 'report';

const OPTIONS: Array<{ value: CaseStudyLayout; icon: React.ElementType }> = [
    { value: 'story', icon: BookOpen },
    { value: 'feature', icon: ImageIcon },
    { value: 'report', icon: BarChart3 },
];

interface LayoutChooserProps {
    value: CaseStudyLayout;
    onChange: (value: CaseStudyLayout) => void;
    /** Id of a heading that already names the chooser; its own label is then left out. */
    labelledBy?: string;
}

const line = (width: string, tone = 'bg-muted-foreground/25') => (
    <span className={cn('block h-1 rounded-full', tone, width)} />
);

/**
 * A tiny drawing of the page each layout makes (CSS only, no images): Story is
 * a photo over flowing text, Feature one bold statement, Report text beside an
 * "At a glance" box. Flex layout, so it mirrors itself in right-to-left pages.
 */
function LayoutThumbnail({ layout, selected }: { layout: CaseStudyLayout; selected: boolean }) {
    const accent = selected ? 'bg-ccm-water' : 'bg-ccm-slate/50';
    return (
        <span
            aria-hidden="true"
            data-thumbnail={layout}
            className={cn(
                'mb-3 flex h-20 w-full overflow-hidden rounded-lg border bg-background p-2 transition-colors',
                selected ? 'border-ccm-water/60' : 'border-border'
            )}
        >
            {layout === 'story' && (
                <span className="flex w-full flex-col gap-1">
                    <span className={cn('block h-7 w-full rounded', selected ? 'bg-ccm-sky' : 'bg-ccm-sky/60')} />
                    {line('w-full')}
                    {line('w-11/12')}
                    {line('w-4/5')}
                </span>
            )}
            {layout === 'feature' && (
                <span className="flex w-full flex-col justify-center gap-1.5">
                    <span className={cn('block h-2.5 w-11/12 rounded-sm', selected ? 'bg-ccm-midnight' : 'bg-ccm-midnight/60')} />
                    <span className={cn('block h-2.5 w-2/3 rounded-sm', selected ? 'bg-ccm-midnight' : 'bg-ccm-midnight/60')} />
                    <span className={cn('block h-1 w-1/4 rounded-full', accent)} />
                </span>
            )}
            {layout === 'report' && (
                <span className="flex w-full gap-2">
                    <span className="flex flex-1 flex-col gap-1 pt-0.5">
                        {line('w-full')}
                        {line('w-11/12')}
                        {line('w-full')}
                        {line('w-3/4')}
                        {line('w-5/6')}
                    </span>
                    <span className="flex w-2/5 flex-col gap-1 rounded border border-ccm-amber/40 bg-ccm-amber/15 p-1">
                        <span className={cn('block h-1 w-2/3 rounded-full', selected ? 'bg-ccm-amber' : 'bg-ccm-amber/70')} />
                        {line('w-full')}
                        {line('w-4/5')}
                    </span>
                </span>
            )}
        </span>
    );
}

/**
 * Task E3 — layout chooser (parent spec §8a/C1). Three cards writing the
 * caseStudy `layout` field: same content, different detail-page arrangement.
 */
export function LayoutChooser({ value, onChange, labelledBy }: LayoutChooserProps) {
    const t = useTranslations('caseStudySubmission.layoutChooser');

    return (
        <div>
            {!labelledBy && <p className="font-heading text-sm font-semibold text-ccm-midnight">{t('label')}</p>}
            <p className="mt-1 text-sm text-muted-foreground">{t('hint')}</p>
            <div
                role="radiogroup"
                {...(labelledBy ? { 'aria-labelledby': labelledBy } : { 'aria-label': t('label') })}
                className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3"
            >
                {OPTIONS.map(({ value: option, icon: Icon }) => {
                    const selected = value === option;
                    return (
                        <button
                            key={option}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => onChange(option)}
                            className={cn(
                                'min-h-11 rounded-xl border p-3 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ccm-water',
                                selected
                                    ? 'border-ccm-water bg-ccm-water/5 ring-1 ring-ccm-water'
                                    : 'border-border hover:border-ccm-water/50'
                            )}
                        >
                            <LayoutThumbnail layout={option} selected={selected} />
                            <span className="flex items-center gap-2">
                                <Icon
                                    className={cn(
                                        'h-4 w-4 shrink-0',
                                        selected ? 'text-ccm-water' : 'text-muted-foreground'
                                    )}
                                    aria-hidden="true"
                                />
                                <span className="font-heading font-semibold text-ccm-midnight">
                                    {t(`${option}.title`)}
                                </span>
                            </span>
                            <span className="mt-1 block text-sm text-muted-foreground">
                                {t(`${option}.caption`)}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
