import { cn } from "@/lib/utils";
import SectionContainer from "@/components/ui/section-container";
import { stegaClean } from "next-sanity";
import { PAGE_QUERYResult } from "@/sanity.types";
import GridCard from "./grid-card";
import GridPost from "./grid-post";
// import PricingCard from "./pricing-card";
import GridReport from "./grid-report";
import GridCaseStudy from "./grid-case-study";
import GridNews from "./grid-news";
import GridLivedExperience from "./grid-lived-experience";

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type GridRow = Extract<Block, { _type: "grid-row" }>;

// Define our own types to avoid Sanity's union type issues
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
type ExtendedGridColumn = GridCardType | GridPostType | GridReportType | GridCaseStudyType;

// Simplified component map with explicit type union
const componentMap: Record<string, React.ComponentType<any>> = {
    "grid-card": GridCard,
    "grid-post": GridPost,
    "grid-report": GridReport,
    "grid-case-study": GridCaseStudy,
    "grid-news": GridNews,
    "grid-lived-experience": GridLivedExperience,
};

interface GridRowProps extends GridRow {
    locale?: string;
    userId?: string;
    rowId?: string;
    tagLine?: string;
    title?: string;
}

export default function GridRow({
                                    padding,
                                    background,
                                    tagLine,
                                    title,
                                    gridColumns,
                                    columns,
                                    locale,
                                    userId,
                                    rowId,
                                }: GridRowProps) {
    return (
        <SectionContainer background={background} padding={padding}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Grid Header */}
                {(tagLine || title) && (
                    <div className="mb-12 text-center">
                        {tagLine && (
                            <h1 className="leading-[0] font-sans animate-fade-up [animation-delay:100ms] opacity-0">
                                <span className="text-base font-semibold">{tagLine}</span>
                            </h1>
                        )}
                        {title && (
                            <h2 className="mt-6 font-bold leading-[1.1] text-4xl md:text-5xl lg:text-6xl animate-fade-up [animation-delay:200ms] opacity-0">
                                {title}
                            </h2>
                        )}
                    </div>
                )}

                {columns && columns?.length > 0 && (
                    <div
                    className={cn(
                        "grid gap-6", // Clean grid without negative margins
                        // Modern responsive grid with proper card sizing
                        stegaClean(gridColumns) === "grid-cols-4"
                            ? "grid-cols-2 md:grid-cols-2 lg:grid-cols-4" // 4 cols: mobile 2, tablet 2, desktop 4
                            : stegaClean(gridColumns) === "grid-cols-3"
                            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" // 3 cols: mobile 1, tablet 2, desktop 3
                            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-2" // 2 cols: mobile 1, tablet 2, desktop 2
                    )}
                    style={{
                        // Ensure cards don't overflow and maintain consistent height
                        gridAutoRows: "1fr",
                        minHeight: "fit-content",
                    }}
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
                            <Component
                                {...(column as any)}
                                key={uniqueKey}
                                locale={locale || 'en'}
                                userId={userId}
                            />
                        );
                    })}
                </div>
                )}
            </div>
        </SectionContainer>
    );
}
