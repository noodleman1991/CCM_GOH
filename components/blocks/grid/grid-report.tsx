// components/GridReportComponent.tsx

import React from 'react';
import { GridReport, ReportFile, LocalizedString } from '@/types/report';

interface Props {
    data: GridReport;
    locale: keyof LocalizedString;
    userId?: string;
}

export const GridReportComponent: React.FC<Props> = ({ data, locale, userId }) => {
    if (!data) return null;

    const { report, showTags = true, showMetadata = true, showDownloadButtons = true } = data;

    const getLocalizedText = (text?: LocalizedString): string => {
        return text?.[locale] || text?.en || '';
    };

    const files: ReportFile[] = report.files || [];

    return (
        <article className="rounded-lg border bg-white p-4 shadow-sm">
            {/* Report Cover */}
            {report.coverImage?.asset?.url && (
                <img
                    src={report.coverImage.asset.url}
                    alt={report.coverImage.alt || ''}
                    className="mb-4 w-full rounded object-cover"
                />
            )}

            {/* Title */}
            <h2 className="text-lg font-semibold">{getLocalizedText(report.title)}</h2>

            {/* Subtitle */}
            {report.subtitle && <p className="text-sm text-gray-500">{getLocalizedText(report.subtitle)}</p>}

            {/*/!* Metadata *!/*/}
            {/*{showMetadata && (*/}
            {/*    <div className="mt-2 text-sm text-gray-600 space-y-1">*/}
            {/*        {report.year && <div>📅 {report.year}</div>}*/}

            {/*        {report.organizations?.length > 0 && (*/}
            {/*            <div>*/}
            {/*                🏢{' '}*/}
            {/*                {report.organizations.map((org) => (*/}
            {/*                    <span key={org._id} className="mr-2">*/}
            {/*      {org.name}*/}
            {/*    </span>*/}
            {/*                ))}*/}
            {/*            </div>*/}
            {/*        )}*/}

            {/*        {report.authors?.length > 0 && (*/}
            {/*            <div>*/}
            {/*                ✍️{' '}*/}
            {/*                {report.authors.map((author, i) => (*/}
            {/*                    <span key={i}>*/}
            {/*      {author.name}*/}
            {/*                        {i < report.authors.length - 1 && ', '}*/}
            {/*    </span>*/}
            {/*                ))}*/}
            {/*            </div>*/}
            {/*        )}*/}
            {/*    </div>*/}
            {/*)}*/}

            {/* Description */}
            {report.description && (
                <p className="mt-3 text-sm text-gray-700">{getLocalizedText(report.description)}</p>
            )}

            {/*/!* Tags *!/*/}
            {/*{showTags && report.tags?.length > 0 && (*/}
            {/*    <div className="mt-3 flex flex-wrap gap-2">*/}
            {/*        {report.tags.map((tag) => (*/}
            {/*            <span*/}
            {/*                key={tag._id}*/}
            {/*                className="inline-block rounded bg-gray-100 px-2 py-1 text-xs text-gray-700"*/}
            {/*            >*/}
            {/*  {getLocalizedText(tag.label)}*/}
            {/*</span>*/}
            {/*        ))}*/}
            {/*    </div>*/}
            {/*)}*/}

            {/* Files */}
            {showDownloadButtons && files.length > 0 && (
                <div className="mt-4">
                    <h4 className="mb-2 font-medium">Downloads:</h4>
                    <ul className="space-y-2">
                        {files.map((file, i) => (
                            <li key={i} className="flex items-center justify-between text-sm">
                                <div>
                                    <span className="font-medium">{file.language.toUpperCase()}</span>{' '}
                                    {file.file?.asset?.originalFilename && (
                                        <span className="text-gray-500">({file.file.asset.originalFilename})</span>
                                    )}
                                    {file.fileSize && (
                                        <span className="ml-2 text-gray-400">• {file.fileSize.toFixed(2)} MB</span>
                                    )}
                                </div>

                                {file.fileUrl && (
                                    <a
                                        href={file.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="rounded bg-blue-600 px-3 py-1 text-white text-xs hover:bg-blue-700"
                                    >
                                        Download
                                    </a>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </article>
    );
};

export default GridReportComponent;
