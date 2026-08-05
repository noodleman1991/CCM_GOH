import { cn } from "@/lib/utils";
import SectionContainer from "@/components/ui/section-container";
import { stegaClean } from "next-sanity";
import { PAGE_QUERY_RESULT } from "@/sanity.types";
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
import { getLocalizedField } from "@/lib/localization-utils";
import { resolveGridColumns } from "@/lib/grid-layout";
import { gridGap } from "@/lib/design-tokens";
import { getTranslations } from "next-intl/server";

type Block = NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];
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

/** Drop repeat columns that point at the SAME referenced document — an editor
 *  duplicating a reference in the CMS otherwise renders the same card twice
 *  side by side (the homepage news grid shipped exactly that). Identity is the
 *  referenced doc's _id when the column carries one; columns without a
 *  reference (e.g. hand-written grid-card) fall back to their _key, which is
 *  unique per array entry and so never collides. */
function dedupeGridColumns<T extends { _key?: string }>(columns: T[]): T[] {
    const seen = new Set<string>();
    return columns.filter((column) => {
        const c = column as Record<string, { _id?: string } | undefined> & { _key?: string };
        const refId =
            c.post?._id ?? c.report?._id ?? c.agenda?._id ?? c.caseStudy?._id ??
            c.news?._id ?? c.newsPost?._id ?? c.livedExperience?._id ?? c.externalSource?._id;
        const identity = refId ?? column._key;
        if (!identity) return true;
        if (seen.has(identity)) return false;
        seen.add(identity);
        return true;
    });
}

/** Responsive `sizes` for images inside a grid column. The content area is
 *  capped at max-w-6xl (1152px), so above that breakpoint columns have a
 *  fixed pixel width; below it they track the viewport. */
function sizesForColumns(cols: number): string {
    const capped = Math.round(1152 / cols); // content capped at max-w-6xl
    return `(min-width: 1152px) ${capped}px, (min-width: 1024px) ${Math.round(100 / cols)}vw, (min-width: 768px) 50vw, 100vw`;
}

interface GridRowProps extends Omit<GridRow, 'initialDisplayCount' | 'headerImage'> {
    locale?: string;
    userId?: string;
    rowId?: string;
    headerImage?: any;
    initialDisplayCount?: number;
}

export default async function GridRow({
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

    // Single source of truth for column count: wide cards max out at 2 columns.
    // Class literals live in lib/grid-layout.ts (scanned by Tailwind).
    const cleanedColumns = stegaClean(gridColumns);
    const { cols, className: gridColumnsClass } = resolveGridColumns(cleanedColumns, variant);
    const imageSizes = sizesForColumns(cols);

    const supportedLocale = (locale || "en") as 'en' | 'es' | 'fr' | 'ar';

    // Resolve expand/collapse labels here (server) so ExpandableGrid (a client
    // component) doesn't depend on NextIntlClientProvider context — this grid
    // renders in trees without that provider (e.g. the LE gallery page).
    const t = await getTranslations({ locale: supportedLocale, namespace: "regional" });

    const localizedTitle = typeof title === 'string'
        ? title
        : getLocalizedField(title, supportedLocale, '');

    const localizedSubtitle = typeof subtitle === 'string'
        ? subtitle
        : getLocalizedField(subtitle, supportedLocale, '');

    // Hide the whole section when there's nothing to show. A grid with no items
    // (e.g. a dynamic news/case-study section that has no published content yet)
    // would otherwise render a large heading over empty space, which looks
    // broken to a visitor. Rendering nothing is cleaner than an empty-state.
    if (!columns || columns.length === 0) {
        return null;
    }
    const columnItems = dedupeGridColumns(columns);

    return (
        <SectionContainer background={background as any} padding={padding}>
            <div className="overflow-x-hidden">
                {/* Grid Header - using GridSectionHeader component */}
                <GridSectionHeader
                    title={localizedTitle || undefined}
                    subtitle={localizedSubtitle || undefined}
                    description={description || undefined}
                    headerImage={headerImage}
                    locale={locale || "en"}
                    isRTL={isRTL}
                />

                <ExpandableGrid
                        initialDisplayCount={initialDisplayCount}
                        gridClassName={cn(
                            gridGap("md"), // standard grid gap from the spacing scale
                            // Grid columns derived from the same `cols` used for image sizes
                            gridColumnsClass
                        )}
                        locale={locale || "en"}
                        isRTL={isRTL}
                        expandLabel={t("viewMore")}
                        collapseLabel={t("showLess")}
                    >
                        {columnItems.map((column, index) => {
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
                                        imageSizes={imageSizes}
                                    />
                                </div>
                            );
                        })}
                    </ExpandableGrid>
            </div>
        </SectionContainer>
    );
}
