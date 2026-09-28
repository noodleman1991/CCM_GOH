import { componentMap } from "@/components/blocks/registry";
import { BlockReveal } from "@/components/blocks/block-reveal";
import { SectionEditLink } from "@/components/blocks/section-edit-link";
import { isRTL } from "@/i18n/i18n-helpers";

/** A page block, in its raw CMS shape (`_type`/`_key` discriminant plus
 *  whatever fields that block type carries). Loose by design — Blocks just
 *  dispatches on `_type` and spreads the rest into the matching component,
 *  which owns its own precise prop type. Matches lib/content/pages.ts's
 *  `ContentBlock` comment: the raw values here use `_type`/`_key`, not the
 *  `type`/`key` that alias's own label uses. */
type Block = { _type: string; _key: string } & Record<string, unknown>;

interface BlocksProps {
    blocks: Block[];
    locale: string;
    translations?: Array<{
        language: string;
        path: string;
        title: string;
    }>;
    userId?: string;
    /** Staff only: where each section is edited in the admin (by position). */
    editHref?: (index: number) => string;
    editLabel?: string;
}


export default function Blocks({ blocks, locale, userId, editHref, editLabel }: BlocksProps) {
    const rtl = isRTL(locale);

    // Filter out PortableText blocks that should not be rendered here.
    // PortableText blocks have _type: "block" and belong to PortableTextRenderer;
    // if one lands in a page's `blocks[]` it's a content-modeling slip in Sanity.
    // We drop it defensively and only warn in development (so prod logs stay clean).
    const pageBlocks = (blocks?.filter(block => {
        if ((block as { _type: string })._type === 'block') {
            if (process.env.NODE_ENV !== 'production') {
                console.warn(
                    'PortableText block detected in page blocks array. This should be rendered via PortableTextRenderer, not Blocks component.',
                    (block as { _key?: string })._key
                );
            }
            return false;
        }
        return true;
    }) || []) as Exclude<typeof blocks, { _type: 'block' }>;

    return (
        <>
            {pageBlocks.map((block, index) => {
                const Component = componentMap[block._type];
                if (!Component) {
                    console.warn(
                        `No component implemented for block type: ${block._type}`
                    );
                    return <div data-type={block._type} key={block._key} />;
                }
                return (
                    <BlockReveal key={block._key}>
                        {editHref && <SectionEditLink href={editHref(index)} label={editLabel ?? "Edit"} />}
                        <Component
                            {...(block as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
                            locale={locale}
                            isRTL={rtl}
                            userId={userId} // Pass userId for download tracking
                        />
                    </BlockReveal>
                );
            })}
        </>
    );
}
