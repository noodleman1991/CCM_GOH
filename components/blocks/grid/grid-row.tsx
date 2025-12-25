import { cn } from "@/lib/utils";
import SectionContainer from "@/components/ui/section-container";
import { stegaClean } from "next-sanity";
import { PAGE_QUERYResult } from "@/sanity.types";
import GridCard from "./grid-card";
import GridPost from "./grid-post";
// import PricingCard from "./pricing-card";
import GridReport from "./grid-report";
import GridAgenda from "./grid-agenda";
import GridCaseStudy from "./grid-case-study";
import GridNews from "./grid-news";
import GridLivedExperience from "./grid-lived-experience";
import GridExternalSource from "./grid-external-source";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { GridSectionHeader } from "./grid-section-header";
import { ExpandableGrid } from "./expandable-grid";

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type GridRow = Extract<Block, { _type: "grid-row" }>;

type GridCardType = {
    _type: "grid-card";
    _key: string;
    title?: string;
    excerpt?: string;
    image?: any;
    link?: any;
};

type GridPostType = {
    _type: "grid-post";
    _key: string;
    post?: any;
};

type GridReportType = {
    _type: "grid-report";
    _key: string;
    report: any;
    showTags?: boolean;
    showDownloadButtons?: boolean;
    showMetadata?: boolean;
};

type GridAgendaType = {
    _type: "grid-agenda";
    _key: string;
    agenda: any;
    showTags?: boolean;
    showDownloadButtons?: boolean;
    showMetadata?: boolean;
};

type GridCaseStudyType = {
    _type: "grid-case-study";
    _key: string;
    caseStudy: any;
    showTags?: boolean;
    showAuthors?: boolean;
    showMetadata?: boolean;
    customExcerpt?: string;
};

// Union of all possible grid column types
type ExtendedGridColumn = GridCardType | GridPostType | GridReportType | GridAgendaType | GridCaseStudyType;

// Simplified component map with explicit type union
const componentMap: Record<string, React.ComponentType<any>> = {
    "grid-card": GridCard,
    "grid-post": GridPost,
    "grid-report": GridReport,
    "grid-agenda": GridAgenda,
    "grid-case-study": GridCaseStudy,
    "grid-news": GridNews,
    "grid-lived-experience": GridLivedExperience,
    "grid-external-source": GridExternalSource,
};

interface GridRowProps extends GridRow {
    locale?: string;
    userId?: string;
    rowId?: string;
    subtitle?: string;
    headerImage?: any;
    initialDisplayCount?: number;
}

export default function GridRow({
                                    padding,
                                    background,
                                    description,
                                    title,
                                    subtitle,
                                    headerImage,
                                    gridColumns,
                                    cardVariant,
                                    columns,
                                    locale,
                                    userId,
                                    rowId,
                                    initialDisplayCount,
                                }: GridRowProps) {
    const variant = (stegaClean(cardVariant) as "classic" | "wide" | null) || "classic";
    const isRTL = locale === "ar";

    return (
        <SectionContainer background={background} padding={padding}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-hidden">
                {/* Grid Header - using GridSectionHeader component */}
                <GridSectionHeader
                    title={title || undefined}
                    subtitle={subtitle}
                    description={description || undefined}
                    headerImage={headerImage}
                    locale={locale || "en"}
                    isRTL={isRTL}
                />

                {columns && columns?.length > 0 ? (
                    <ExpandableGrid
                        initialDisplayCount={initialDisplayCount}
                        gridClassName={cn(
                            "gap-4 md:gap-6 lg:gap-8", // Clean grid without negative margins
                            // Grid columns based on variant and gridColumns setting
                            variant === "wide"
                                ? "grid-cols-1 lg:grid-cols-2" // Wide cards: max 2 columns
                                : stegaClean(gridColumns) === "grid-cols-4"
                                ? "grid-cols-2 md:grid-cols-2 lg:grid-cols-4" // Classic 4 cols: mobile 2, tablet 2, desktop 4
                                : stegaClean(gridColumns) === "grid-cols-3"
                                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" // Classic 3 cols: mobile 1, tablet 2, desktop 3
                                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-2" // Classic 2 cols: mobile 1, tablet 2, desktop 2
                        )}
                        locale={locale || "en"}
                        isRTL={isRTL}
                    >
                        {columns.map((column, index) => {
                            // Type guard to ensure column has required properties
                            if (!column || typeof column !== 'object' || !('_type' in column) || !column._type) {
                                console.warn('Invalid column object:', column);
                                return null;
                            }

                            const Component = componentMap[column._type];

                            const uniqueKey = column._key
                                ? `${rowId || 'row'}-${column._key}`
                                : `${rowId || 'row'}-${column._type}-${index}`;

                            if (!Component) {
                                // Fallback for development/debugging of new component types
                                console.warn(
                                    `No component implemented for grid column type: ${column._type}`
                                );
                                return <div data-type={column._type} key={uniqueKey} />;
                            }

                            return (
                                <div key={uniqueKey} className="min-w-0 h-full flex">
                                    <Component
                                        {...(column as any)}
                                        locale={locale || 'en'}
                                        userId={userId}
                                        cardVariant={variant}
                                    />
                                </div>
                            );
                        })}
                    </ExpandableGrid>
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        <p className="text-lg">No content available yet.</p>
                        <p className="text-sm mt-2">Check back soon for updates.</p>
                    </div>
                )}
            </div>
        </SectionContainer>
    );
}
