"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type AuthorRole = 'lead' | 'coauthor' | 'contributor' | 'advisor';

export interface BylineAuthor {
    name: string;
    email?: string;
    role: AuthorRole;
}

const ROLES: AuthorRole[] = ['lead', 'coauthor', 'contributor', 'advisor'];

function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    return parts
        .slice(0, 2)
        .map((p) => p[0]!.toLocaleUpperCase())
        .join('');
}

interface BylineChipsProps {
    authors: BylineAuthor[];
    onAdd: () => void;
    onUpdate: (index: number, field: 'name' | 'email' | 'role', value: string) => void;
    onRemove: (index: number) => void;
    error?: string;
}

/**
 * Task E3 — byline row. Renders the submission's author list as editorial
 * chips; tapping a chip opens an inline editor for that author. Same author
 * data shape as before (name/email/role), just a chip presentation.
 */
export function BylineChips({ authors, onAdd, onUpdate, onRemove, error }: BylineChipsProps) {
    const t = useTranslations('caseStudySubmission.byline');
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const open = openIndex !== null && openIndex < authors.length ? openIndex : null;

    return (
        <div>
            <p className="font-heading text-sm font-semibold text-ccm-midnight">{t('label')}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
                {authors.map((author, index) => {
                    const isOpen = open === index;
                    return (
                        <button
                            key={index}
                            type="button"
                            aria-expanded={isOpen}
                            onClick={() => setOpenIndex(isOpen ? null : index)}
                            className={cn(
                                'flex min-h-11 items-center gap-2 rounded-full border py-1.5 ps-1.5 pe-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ccm-water',
                                isOpen
                                    ? 'border-ccm-water bg-ccm-water/5'
                                    : 'border-border hover:border-ccm-water/50'
                            )}
                        >
                            <span
                                aria-hidden="true"
                                className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ccm-water/15 text-xs font-bold text-ccm-sea"
                            >
                                {initials(author.name)}
                            </span>
                            <span className="text-start">
                                <span className="block text-sm font-medium text-ccm-midnight">
                                    {author.name.trim() || t('unnamed')}
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                    {t(`roles.${author.role}`)}
                                </span>
                            </span>
                        </button>
                    );
                })}
                <button
                    type="button"
                    onClick={() => {
                        onAdd();
                        // The new author is appended, so it lands at the current length.
                        setOpenIndex(authors.length);
                    }}
                    className="flex min-h-11 items-center gap-2 rounded-full border border-dashed border-border px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:border-ccm-water/60 hover:text-ccm-sea focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ccm-water"
                >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    {t('addAuthor')}
                </button>
            </div>

            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

            {open !== null && (
                <div className="mt-3 rounded-xl border bg-muted/20 p-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <Label htmlFor={`byline-name-${open}`}>{t('nameLabel')}</Label>
                            <Input
                                id={`byline-name-${open}`}
                                value={authors[open].name}
                                onChange={(e) => onUpdate(open, 'name', e.target.value)}
                                placeholder={t('namePlaceholder')}
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <Label htmlFor={`byline-email-${open}`}>{t('emailLabel')}</Label>
                            <Input
                                id={`byline-email-${open}`}
                                type="email"
                                value={authors[open].email || ''}
                                onChange={(e) => onUpdate(open, 'email', e.target.value)}
                                placeholder="email@example.com"
                                className="mt-2"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <Label>{t('roleLabel')}</Label>
                            <Select
                                value={authors[open].role}
                                onValueChange={(value) => onUpdate(open, 'role', value)}
                            >
                                <SelectTrigger className="mt-2">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROLES.map((role) => (
                                        <SelectItem key={role} value={role}>
                                            {t(`roles.${role}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-2">
                        {authors.length > 1 ? (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    onRemove(open);
                                    setOpenIndex(null);
                                }}
                            >
                                <X className="me-2 h-4 w-4" />
                                {t('removeAuthor')}
                            </Button>
                        ) : (
                            <span />
                        )}
                        <Button type="button" variant="outline" size="sm" onClick={() => setOpenIndex(null)}>
                            {t('done')}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
