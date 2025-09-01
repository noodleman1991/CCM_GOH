import { cn } from "@/lib/utils";
import SectionContainer from "@/components/ui/section-container";
import { stegaClean } from "next-sanity";
import { PAGE_QUERYResult } from "@/sanity.types";
import GridCard from "./grid-card";
import GridPost from "./grid-post";
// import PricingCard from "./pricing-card";
import GridReport from "./grid-report";
import GridCaseStudy from "./grid-case-study";

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
};

interface GridRowProps extends GridRow {
    locale?: string;
    userId?: string;
    rowId?: string;
}

export default function GridRow({
                                    padding,
                                    colorVariant,
                                    gridColumns,
                                    columns,
                                    locale,
                                    userId,
                                    rowId,
                                }: GridRowProps) {
    const color = stegaClean(colorVariant);

    return (
        <SectionContainer color={color} padding={padding}>
            {columns && columns?.length > 0 && (
                <div
                    className={cn(
                        `grid grid-cols-1 gap-6`,
                        `lg:${stegaClean(gridColumns)}`
                    )}
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
                                color={color}
                                key={uniqueKey}
                                locale={locale || 'en'}
                                userId={userId}
                            />
                        );
                    })}
                </div>
            )}
        </SectionContainer>
    );
}
