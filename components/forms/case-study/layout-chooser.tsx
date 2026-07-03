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
}

/**
 * Task E3 — layout chooser (parent spec §8a/C1). Three cards writing the
 * caseStudy `layout` field: same content, different detail-page arrangement.
 */
export function LayoutChooser({ value, onChange }: LayoutChooserProps) {
    const t = useTranslations('caseStudySubmission.layoutChooser');

    return (
        <div>
            <p className="font-heading text-sm font-semibold text-ccm-midnight">{t('label')}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t('hint')}</p>
            <div
                role="radiogroup"
                aria-label={t('label')}
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
                                'min-h-11 rounded-xl border p-4 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ccm-water',
                                selected
                                    ? 'border-ccm-water bg-ccm-water/5 ring-1 ring-ccm-water'
                                    : 'border-border hover:border-ccm-water/50'
                            )}
                        >
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
