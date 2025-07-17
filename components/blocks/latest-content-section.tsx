"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NewsPostCard from "@/components/ui/news-post-card";
import CaseStudyCard from "@/components/ui/case-study-card";
import ExternalSourceCard from "@/components/ui/external-source-card";
import Link from "next/link";
import { Calendar, Tag, Globe, Building, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from 'next-intl';

interface LatestContentProps {
    newsPosts: any[];
    caseStudies: any[];
    externalSources: any[];
    tags: any[];
    regionalCommunities: any[];
    locale: string;
}

export default function LatestContentSection({
                                                 newsPosts,
                                                 caseStudies,
                                                 externalSources,
                                                 tags,
                                                 regionalCommunities,
                                                 locale
                                             }: LatestContentProps) {
    const t = useTranslations('latestContent');

    const [activeTab, setActiveTab] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");
    const [tagFilter, setTagFilter] = useState<string | null>(null);
    const [regionFilter, setRegionFilter] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    // Combine all content
    const allContent = [
        ...newsPosts.map(item => ({ ...item, contentType: 'news' })),
        ...caseStudies.map(item => ({ ...item, contentType: 'case-study' })),
        ...externalSources.map(item => ({ ...item, contentType: 'external' })),
    ].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // Filter content
    const filteredContent = allContent.filter(item => {
        // Tab filter
        if (activeTab !== "all" && item.contentType !== activeTab) return false;

        // Date filter
        const itemDate = new Date(item.publishedAt);
        const now = new Date();

        switch (dateFilter) {
            case "week":
                const weekAgo = new Date(now.setDate(now.getDate() - 7));
                if (itemDate < weekAgo) return false;
                break;
            case "month":
                const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
                if (itemDate < monthAgo) return false;
                break;
            case "year":
                const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
                if (itemDate < yearAgo) return false;
                break;
        }

        // Tag filter
        if (tagFilter && !item.tags?.some((tag: any) => tag._id === tagFilter)) return false;

        // Region filter
        if (regionFilter) {
            const hasRegion =
                item.regionalCommunities?.some((rc: any) => rc._id === regionFilter) ||
                item.organizations?.some((org: any) => org.regionalCommunity?._id === regionFilter);
            if (!hasRegion) return false;
        }

        return true;
    });

    // Get unique tags from content
    const contentTags = Array.from(
        new Set(
            allContent
                .flatMap(item => item.tags || [])
                .map(tag => tag._id)
        )
    ).map(id => tags.find(tag => tag._id === id)).filter(Boolean);

    const clearFilters = () => {
        setDateFilter("all");
        setTagFilter(null);
        setRegionFilter(null);
    };

    const hasActiveFilters = dateFilter !== "all" || tagFilter || regionFilter;

    return (
        <section className="py-16">
            <div className="container">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-bold mb-2">{t('title')}</h2>
                        <p className="text-muted-foreground">{t('subtitle')}</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(showFilters && "bg-accent")}
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        {t('filters')}
                    </Button>
                </div>

                {/* Filters */}
                {showFilters && (
                    <Card className="mb-6">
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">
                                        <Calendar className="w-4 h-4 inline mr-1" />
                                        {t('dateRange')}
                                    </label>
                                    <Select value={dateFilter} onValueChange={setDateFilter}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{t('allTime')}</SelectItem>
                                            <SelectItem value="week">{t('pastWeek')}</SelectItem>
                                            <SelectItem value="month">{t('pastMonth')}</SelectItem>
                                            <SelectItem value="year">{t('pastYear')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-2 block">
                                        <Tag className="w-4 h-4 inline mr-1" />
                                        {t('tags')}
                                    </label>
                                    <Select value={tagFilter || "all"} onValueChange={(value) => setTagFilter(value === "all" ? null : value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{t('allTags')}</SelectItem>
                                            {contentTags.map(tag => (
                                                <SelectItem key={tag._id} value={tag._id}>
                                                    {tag.label[locale] || tag.label.en}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-2 block">
                                        <Globe className="w-4 h-4 inline mr-1" />
                                        {t('region')}
                                    </label>
                                    <Select value={regionFilter || "all"} onValueChange={(value) => setRegionFilter(value === "all" ? null : value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{t('allRegions')}</SelectItem>
                                            {regionalCommunities.map(region => (
                                                <SelectItem key={region._id} value={region._id}>
                                                    {region.name[locale] || region.name.en}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="mt-4"
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    {t('clearFilters')}
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Content Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-8">
                        <TabsTrigger value="all">
                            {t('all')} ({allContent.length})
                        </TabsTrigger>
                        <TabsTrigger value="news">
                            {t('news')} ({newsPosts.length})
                        </TabsTrigger>
                        <TabsTrigger value="case-study">
                            {t('caseStudies')} ({caseStudies.length})
                        </TabsTrigger>
                        <TabsTrigger value="external">
                            {t('external')} ({externalSources.length})
                        </TabsTrigger>
                    </TabsList>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredContent.slice(0, 9).map((item) => {
                            if (item.contentType === 'news') {
                                return (
                                    <Link key={item._id} href={`/news/${item.slug.current}`}>
                                        <NewsPostCard {...item} locale={locale} />
                                    </Link>
                                );
                            } else if (item.contentType === 'case-study') {
                                return (
                                    <Link key={item._id} href={`/case-studies/${item.slug.current}`}>
                                        <CaseStudyCard {...item} locale={locale} />
                                    </Link>
                                );
                            } else {
                                return (
                                    <ExternalSourceCard key={item._id} {...item} locale={locale} />
                                );
                            }
                        })}
                    </div>

                    {filteredContent.length === 0 && (
                        <Card className="text-center py-12">
                            <CardContent>
                                <p className="text-muted-foreground">{t('noContent')}</p>
                                {hasActiveFilters && (
                                    <Button
                                        variant="link"
                                        onClick={clearFilters}
                                        className="mt-2"
                                    >
                                        {t('clearFiltersToSeeMore')}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {filteredContent.length > 9 && (
                        <div className="text-center mt-8">
                            <Button variant="outline" asChild>
                                <Link href={activeTab === "all" ? "/news" : `/news?type=${activeTab}`}>
                                    {t('viewAll')} ({filteredContent.length})
                                </Link>
                            </Button>
                        </div>
                    )}
                </Tabs>
            </div>
        </section>
    );
}
