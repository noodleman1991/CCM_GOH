import React from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
    Calendar,
    Building,
    Eye,
    Lock,
    AlertCircle
} from 'lucide-react';
import { urlFor } from '@/sanity/lib/image';
import {
    Agenda,
    SupportedLanguage
} from '@/types/agenda';
import {
    getLocalizedText,
    getAvailableLanguages,
    getAgendaTypeLabel,
    canAccessAgenda
} from '@/lib/agenda-utils';
import { cn } from '@/lib/utils';
import { DownloadSection } from './grid-agenda-download';

interface GridAgendaComponentProps {
    _type: 'grid-agenda';
    _key: string;
    agenda: Agenda;
    showTags?: boolean;
    showDownloadButtons?: boolean;
    showMetadata?: boolean;
    locale: string;
    userId?: string;
    className?: string;
    color?: string;
    cardVariant?: string;
}

export default function GridAgendaComponent({
                                                agenda,
                                                showTags = true,
                                                showDownloadButtons = true,
                                                showMetadata = true,
                                                locale,
                                                userId,
                                                className,
                                                cardVariant = "classic",
                                            }: GridAgendaComponentProps) {
    if (!agenda) return null;

    const aspectRatioClass = cardVariant === "wide" ? "aspect-video" : "aspect-[3/2]";

    const title = getLocalizedText(agenda.title, locale);
    const subtitle = getLocalizedText(agenda.subtitle, locale);
    const description = getLocalizedText(agenda.description, locale);

    const availableLanguages = getAvailableLanguages(agenda);
    const hasFiles = availableLanguages.length > 0;

    const agendaTypeLabel = getAgendaTypeLabel(agenda.agendaType);
    const canAccess = canAccessAgenda(agenda.accessLevel, userId ? 'user' : 'guest');

    const totalDownloads = agenda.totalDownloadCount || 0;
    const publishDate = agenda.publishDate ? new Date(agenda.publishDate) : null;

    return (
        <Card className={cn(
            "flex w-full h-full flex-col justify-between overflow-hidden transition ease-in-out group border rounded-3xl p-6 hover:border-primary",
        )}>
            {/* Access restriction overlay */}
            {!canAccess && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                    <div className="text-center text-white p-4">
                        <Lock className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm font-medium">
                            {agenda.accessLevel === 'registered' ? 'Please sign in to download' : 'Members only'}
                        </p>
                    </div>
                </div>
            )}

            {/* Cover Image */}
            {agenda.coverImage?.asset?.url && (
                <div className={cn("mb-4 relative rounded-2xl overflow-hidden w-full max-w-full min-w-0", aspectRatioClass)}>
                    <Image
                        src={urlFor(agenda.coverImage).width(400).height(225).url()}
                        alt={agenda.coverImage.alt || title}
                        fill
                        className="object-cover transition-transform duration-200 group-hover:scale-105"
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    />

                    {/* Agenda type badge */}
                    <div className="absolute top-3 left-3">
                        <Badge variant="secondary" className="bg-white/90 text-black">
                            {agendaTypeLabel}
                        </Badge>
                    </div>

                    {/* Featured badge */}
                    {agenda.featured && (
                        <div className="absolute top-3 right-3">
                            <Badge className="bg-yellow-500 text-black">
                                ⭐ Featured
                            </Badge>
                        </div>
                    )}
                </div>
            )}

            <CardHeader className="pb-3 px-0">
                <div className="space-y-2">
                    {/* Title */}
                    <h3 className="font-semibold text-lg leading-tight line-clamp-4 group-hover:text-primary transition-colors">
                        {title}
                    </h3>

                    {/* Subtitle */}
                    {subtitle && (
                        <p className="text-sm text-foreground line-clamp-3">
                            {subtitle}
                        </p>
                    )}
                </div>
            </CardHeader>

            <CardContent className="flex-1 pb-3 px-0">
                {/* Description */}
                {description && (
                    <p className="text-sm text-foreground line-clamp-14 mb-4">
                        {description}
                    </p>
                )}

                {/* Metadata */}
                {showMetadata && (
                    <div className="space-y-2 text-xs text-muted-foreground">
                        {/* Publication date and year */}
                        {(publishDate || agenda.year) && (
                            <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>
                                    {publishDate ? publishDate.getFullYear() : agenda.year}
                                </span>
                            </div>
                        )}

                        {/* Organizations */}
                        {agenda.organizations && agenda.organizations.length > 0 && (
                            <div className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                <span className="line-clamp-1">
                                    {agenda.organizations.map(org => org.name).join(', ')}
                                </span>
                            </div>
                        )}

                        {/* Download count */}
                        {totalDownloads > 0 && (
                            <div className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                <span>{totalDownloads} downloads</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Tags */}
                {showTags && agenda.tags && agenda.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                        {agenda.tags.slice(0, 3).map((tag) => (
                            <Badge
                                key={tag._id}
                                variant="outline"
                                className="text-xs"
                                style={{
                                    borderColor: tag.color,
                                    color: tag.color
                                }}
                            >
                                {getLocalizedText(tag.label, locale)}
                            </Badge>
                        ))}
                        {agenda.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                                +{agenda.tags.length - 3} more
                            </Badge>
                        )}
                    </div>
                )}
            </CardContent>

            <CardFooter className="pt-0 px-0">
                {/* Download section - Client Component */}
                <DownloadSection
                    agenda={agenda}
                    availableLanguages={availableLanguages}
                    hasFiles={hasFiles}
                    canAccess={canAccess}
                    showDownloadButtons={showDownloadButtons}
                    locale={locale}
                    userId={userId}
                />
            </CardFooter>
        </Card>
    );
}
