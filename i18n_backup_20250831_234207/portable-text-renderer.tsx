import { PortableText, PortableTextProps } from "@portabletext/react";
import Image from "next/image";
import Link from "next/link";
import { YouTubeEmbed } from "@next/third-parties/google";
import { Highlight, themes } from "prism-react-renderer";
import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";

interface PortableTextRendererProps extends PortableTextProps {
    locale?: string;
    isRTL?: boolean;
}

const portableTextComponents: PortableTextProps["components"] = {
    types: {
        image: ({ value }) => {
            const { url, metadata } = value.asset;
            const { lqip, dimensions } = metadata;
            return (
                <Image
                    src={url}
                    alt={value.alt || "Image"}
                    width={dimensions.width}
                    height={dimensions.height}
                    placeholder={lqip ? "blur" : undefined}
                    blurDataURL={lqip || undefined}
                    className="rounded-2xl mx-auto my-4"
                    quality={100}
                />
            );
        },
        youtube: ({ value }) => {
            const { videoId } = value;
            return (
                <div className="aspect-video max-w-[45rem] rounded-xl overflow-hidden mb-4 mx-auto">
                    <YouTubeEmbed videoid={videoId} params="rel=0" />
                </div>
            );
        },
        code: ({ value }) => {
            return (
                <div className="grid my-4 overflow-x-auto rounded-lg border border-border text-xs lg:text-sm bg-primary/80 dark:bg-muted/80">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-primary/80 dark:bg-muted">
                        <div className="text-muted-foreground font-mono">
                            {value.filename || ""}
                        </div>
                        <CopyButton code={value.code} />
                    </div>
                    <Highlight
                        theme={themes.vsDark}
                        code={value.code}
                        language={value.language || "typescript"}
                    >
                        {({ style, tokens, getLineProps, getTokenProps }) => (
                            <pre
                                style={{
                                    ...style,
                                    padding: "1.5rem",
                                    margin: 0,
                                    overflow: "auto",
                                    backgroundColor: "transparent",
                                }}
                            >
                {tokens.map((line, i) => (
                    <div key={i} {...getLineProps({ line })}>
                        {line.map((token, key) => (
                            <span key={key} {...getTokenProps({ token })} />
                        ))}
                    </div>
                ))}
              </pre>
                        )}
                    </Highlight>
                </div>
            );
        },
    },
    block: {
        normal: ({ children }) => (
            <p className="mb-4 font-body leading-relaxed">{children}</p>
        ),
        h1: ({ children }) => (
            <h1 className="mb-4 mt-4 font-heading text-4xl font-bold">{children}</h1>
        ),
        h2: ({ children }) => (
            <h2 className="mb-4 mt-4 font-heading text-3xl font-bold">{children}</h2>
        ),
        h3: ({ children }) => (
            <h3 className="mb-4 mt-4 font-heading text-2xl font-semibold">{children}</h3>
        ),
        h4: ({ children }) => (
            <h4 className="mb-3 mt-3 font-heading text-xl font-semibold">{children}</h4>
        ),
        h5: ({ children }) => (
            <h5 className="mb-3 mt-3 font-heading text-lg font-semibold">{children}</h5>
        ),
        blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-6 py-2 my-6 italic bg-muted/50 rounded-r-lg font-body">
                {children}
            </blockquote>
        ),
    },
    marks: {
        link: ({ value, children }) => {
            const isExternal =
                (value?.href || "").startsWith("http") ||
                (value?.href || "").startsWith("https") ||
                (value?.href || "").startsWith("mailto");
            const target = isExternal ? "_blank" : undefined;
            return (
                <Link
                    href={value?.href}
                    target={target}
                    rel={target ? "noopener" : undefined}
                    className="text-primary underline hover:no-underline transition-all font-body"
                >
                    {children}
                </Link>
            );
        },
        strong: ({ children }) => (
            <strong className="font-bold font-body">{children}</strong>
        ),
        em: ({ children }) => (
            <em className="italic font-body">{children}</em>
        ),
        code: ({ children }) => (
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                {children}
            </code>
        ),
    },
    list: {
        bullet: ({ children }) => (
            <ul className="list-disc pl-6 mb-4 font-body leading-relaxed">
                {children}
            </ul>
        ),
        number: ({ children }) => (
            <ol className="list-decimal pl-6 mb-4 font-body leading-relaxed">
                {children}
            </ol>
        ),
    },
    listItem: {
        bullet: ({ children }) => (
            <li className="mb-2">{children}</li>
        ),
        number: ({ children }) => (
            <li className="mb-2">{children}</li>
        ),
    },
};

// RTL version with proper font classes
const rtlPortableTextComponents: PortableTextProps["components"] = {
    types: {
        image: portableTextComponents.types!.image,
        youtube: portableTextComponents.types!.youtube,
        code: portableTextComponents.types!.code,
    },
    block: {
        normal: ({ children }) => (
            <p className="mb-4 font-body leading-relaxed text-right">{children}</p>
        ),
        h1: ({ children }) => (
            <h1 className="mb-4 mt-4 font-heading text-4xl font-bold text-right">{children}</h1>
        ),
        h2: ({ children }) => (
            <h2 className="mb-4 mt-4 font-heading text-3xl font-bold text-right">{children}</h2>
        ),
        h3: ({ children }) => (
            <h3 className="mb-4 mt-4 font-heading text-2xl font-semibold text-right">{children}</h3>
        ),
        h4: ({ children }) => (
            <h4 className="mb-3 mt-3 font-heading text-xl font-semibold text-right">{children}</h4>
        ),
        h5: ({ children }) => (
            <h5 className="mb-3 mt-3 font-heading text-lg font-semibold text-right">{children}</h5>
        ),
        blockquote: ({ children }) => (
            <blockquote className="border-r-4 border-primary pr-6 py-2 my-6 italic bg-muted/50 rounded-l-lg font-body text-right">
                {children}
            </blockquote>
        ),
    },
    marks: {
        link: ({ value, children }) => {
            const isExternal =
                (value?.href || "").startsWith("http") ||
                (value?.href || "").startsWith("https") ||
                (value?.href || "").startsWith("mailto");
            const target = isExternal ? "_blank" : undefined;
            return (
                <Link
                    href={value?.href}
                    target={target}
                    rel={target ? "noopener" : undefined}
                    className="text-primary underline hover:no-underline transition-all font-body"
                >
                    {children}
                </Link>
            );
        },
        strong: ({ children }) => (
            <strong className="font-bold font-body">{children}</strong>
        ),
        em: ({ children }) => (
            <em className="italic font-body">{children}</em>
        ),
        code: ({ children }) => (
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                {children}
            </code>
        ),
    },
    list: {
        bullet: ({ children }) => (
            <ul className="list-disc pr-6 mb-4 font-body leading-relaxed text-right">
                {children}
            </ul>
        ),
        number: ({ children }) => (
            <ol className="list-decimal pr-6 mb-4 font-body leading-relaxed text-right">
                {children}
            </ol>
        ),
    },
    listItem: {
        bullet: ({ children }) => (
            <li className="mb-2 text-right">{children}</li>
        ),
        number: ({ children }) => (
            <li className="mb-2 text-right">{children}</li>
        ),
    },
};

const PortableTextRenderer = ({
                                  value,
                                  locale = 'en',
                                  isRTL = false,
                              }: PortableTextRendererProps) => {
    const shouldUseRTL = isRTL || locale === 'ar';
    const components = shouldUseRTL ? rtlPortableTextComponents : portableTextComponents;

    return (
        <div className={cn(
            "prose prose-lg max-w-none dark:prose-invert",
            "prose-headings:font-heading prose-p:font-body prose-li:font-body",
            shouldUseRTL && "prose-rtl"
        )}>
            <PortableText value={value} components={components} />
        </div>
    );
};

export default PortableTextRenderer;














// import { PortableText, PortableTextProps } from "@portabletext/react";
// import Image from "next/image";
// import Link from "next/link";
// import { YouTubeEmbed } from "@next/third-parties/google";
// import { Highlight, themes } from "prism-react-renderer";
// import { CopyButton } from "@/components/ui/copy-button";
// import { cn } from "@/lib/utils";
//
// interface PortableTextRendererProps extends PortableTextProps {
//     locale?: string;
//     isRTL?: boolean;
// }
//
// const portableTextComponents: PortableTextProps["components"] = {
//     types: {
//         image: ({ value }) => {
//             const { url, metadata } = value.asset;
//             const { lqip, dimensions } = metadata;
//             return (
//                 <Image
//                     src={url}
//                     alt={value.alt || "Image"}
//                     width={dimensions.width}
//                     height={dimensions.height}
//                     placeholder={lqip ? "blur" : undefined}
//                     blurDataURL={lqip || undefined}
//                     className="rounded-2xl mx-auto my-4"
//                     quality={100}
//                 />
//             );
//         },
//         youtube: ({ value }) => {
//             const { videoId } = value;
//             return (
//                 <div className="aspect-video max-w-[45rem] rounded-xl overflow-hidden mb-4 mx-auto">
//                     <YouTubeEmbed videoid={videoId} params="rel=0" />
//                 </div>
//             );
//         },
//         code: ({ value }) => {
//             return (
//                 <div className="grid my-4 overflow-x-auto rounded-lg border border-border text-xs lg:text-sm bg-primary/80 dark:bg-muted/80">
//                     <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-primary/80 dark:bg-muted">
//                         <div className="text-muted-foreground font-mono">
//                             {value.filename || ""}
//                         </div>
//                         <CopyButton code={value.code} />
//                     </div>
//                     <Highlight
//                         theme={themes.vsDark}
//                         code={value.code}
//                         language={value.language || "typescript"}
//                     >
//                         {({ style, tokens, getLineProps, getTokenProps }) => (
//                             <pre
//                                 style={{
//                                     ...style,
//                                     padding: "1.5rem",
//                                     margin: 0,
//                                     overflow: "auto",
//                                     backgroundColor: "transparent",
//                                 }}
//                             >
//                 {tokens.map((line, i) => (
//                     <div key={i} {...getLineProps({ line })}>
//                         {line.map((token, key) => (
//                             <span key={key} {...getTokenProps({ token })} />
//                         ))}
//                     </div>
//                 ))}
//               </pre>
//                         )}
//                     </Highlight>
//                 </div>
//             );
//         },
//     },
//     block: {
//         normal: ({ children }) => (
//             <p className="mb-4 font-body leading-relaxed">{children}</p>
//         ),
//         h1: ({ children }) => (
//             <h1 className="mb-4 mt-4 font-heading text-4xl font-bold">{children}</h1>
//         ),
//         h2: ({ children }) => (
//             <h2 className="mb-4 mt-4 font-heading text-3xl font-bold">{children}</h2>
//         ),
//         h3: ({ children }) => (
//             <h3 className="mb-4 mt-4 font-heading text-2xl font-semibold">{children}</h3>
//         ),
//         h4: ({ children }) => (
//             <h4 className="mb-3 mt-3 font-heading text-xl font-semibold">{children}</h4>
//         ),
//         h5: ({ children }) => (
//             <h5 className="mb-3 mt-3 font-heading text-lg font-semibold">{children}</h5>
//         ),
//         blockquote: ({ children }) => (
//             <blockquote className="border-l-4 border-primary pl-6 py-2 my-6 italic bg-muted/50 rounded-r-lg font-body">
//                 {children}
//             </blockquote>
//         ),
//     },
//     marks: {
//         link: ({ value, children }) => {
//             const isExternal =
//                 (value?.href || "").startsWith("http") ||
//                 (value?.href || "").startsWith("https") ||
//                 (value?.href || "").startsWith("mailto");
//             const target = isExternal ? "_blank" : undefined;
//             return (
//                 <Link
//                     href={value?.href}
//                     target={target}
//                     rel={target ? "noopener" : undefined}
//                     className="text-primary underline hover:no-underline transition-all font-body"
//                 >
//                     {children}
//                 </Link>
//             );
//         },
//         strong: ({ children }) => (
//             <strong className="font-bold font-body">{children}</strong>
//         ),
//         em: ({ children }) => (
//             <em className="italic font-body">{children}</em>
//         ),
//         code: ({ children }) => (
//             <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
//                 {children}
//             </code>
//         ),
//     },
//     list: {
//         bullet: ({ children }) => (
//             <ul className="list-disc pl-6 mb-4 font-body leading-relaxed">
//                 {children}
//             </ul>
//         ),
//         number: ({ children }) => (
//             <ol className="list-decimal pl-6 mb-4 font-body leading-relaxed">
//                 {children}
//             </ol>
//         ),
//     },
//     listItem: {
//         bullet: ({ children }) => (
//             <li className="mb-2">{children}</li>
//         ),
//         number: ({ children }) => (
//             <li className="mb-2">{children}</li>
//         ),
//     },
// };
//
// // RTL version with proper font classes
// const rtlPortableTextComponents: PortableTextProps["components"] = {
//     types: {
//         image: portableTextComponents.types!.image,
//         youtube: portableTextComponents.types!.youtube,
//         code: portableTextComponents.types!.code,
//     },
//     block: {
//         normal: ({ children }) => (
//             <p className="mb-4 font-body leading-relaxed text-right">{children}</p>
//         ),
//         h1: ({ children }) => (
//             <h1 className="mb-4 mt-4 font-heading text-4xl font-bold text-right">{children}</h1>
//         ),
//         h2: ({ children }) => (
//             <h2 className="mb-4 mt-4 font-heading text-3xl font-bold text-right">{children}</h2>
//         ),
//         h3: ({ children }) => (
//             <h3 className="mb-4 mt-4 font-heading text-2xl font-semibold text-right">{children}</h3>
//         ),
//         h4: ({ children }) => (
//             <h4 className="mb-3 mt-3 font-heading text-xl font-semibold text-right">{children}</h4>
//         ),
//         h5: ({ children }) => (
//             <h5 className="mb-3 mt-3 font-heading text-lg font-semibold text-right">{children}</h5>
//         ),
//         blockquote: ({ children }) => (
//             <blockquote className="border-r-4 border-primary pr-6 py-2 my-6 italic bg-muted/50 rounded-l-lg font-body text-right">
//                 {children}
//             </blockquote>
//         ),
//     },
//     marks: {
//         link: ({ value, children }) => {
//             const isExternal =
//                 (value?.href || "").startsWith("http") ||
//                 (value?.href || "").startsWith("https") ||
//                 (value?.href || "").startsWith("mailto");
//             const target = isExternal ? "_blank" : undefined;
//             return (
//                 <Link
//                     href={value?.href}
//                     target={target}
//                     rel={target ? "noopener" : undefined}
//                     className="text-primary underline hover:no-underline transition-all font-body"
//                 >
//                     {children}
//                 </Link>
//             );
//         },
//         strong: ({ children }) => (
//             <strong className="font-bold font-body">{children}</strong>
//         ),
//         em: ({ children }) => (
//             <em className="italic font-body">{children}</em>
//         ),
//         code: ({ children }) => (
//             <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
//                 {children}
//             </code>
//         ),
//     },
//     list: {
//         bullet: ({ children }) => (
//             <ul className="list-disc pr-6 mb-4 font-body leading-relaxed text-right">
//                 {children}
//             </ul>
//         ),
//         number: ({ children }) => (
//             <ol className="list-decimal pr-6 mb-4 font-body leading-relaxed text-right">
//                 {children}
//             </ol>
//         ),
//     },
//     listItem: {
//         bullet: ({ children }) => (
//             <li className="mb-2 text-right">{children}</li>
//         ),
//         number: ({ children }) => (
//             <li className="mb-2 text-right">{children}</li>
//         ),
//     },
// };
//
// const PortableTextRenderer = ({
//                                   value,
//                                   locale = 'en',
//                                   isRTL = false,
//                               }: PortableTextRendererProps) => {
//     const shouldUseRTL = isRTL || locale === 'ar';
//     const components = shouldUseRTL ? rtlPortableTextComponents : portableTextComponents;
//
//     return (
//         <div className={cn(
//             "prose prose-lg max-w-none dark:prose-invert",
//             "prose-headings:font-heading prose-p:font-body prose-li:font-body",
//             shouldUseRTL && "prose-rtl"
//         )}>
//             <PortableText value={value} components={components} />
//         </div>
//     );
// };
//
// export default PortableTextRenderer;
