import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { stegaClean } from "next-sanity";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { PAGE_QUERYResult } from "@/sanity.types";

type Hero1Props = Extract<
    NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number],
    { _type: "hero-1" }
>;

export default function Hero1({
                                  tagLine,
                                  title,
                                  body,
                                  image,
                                  links,
                              }: Hero1Props) {
    return (
        <div className="container dark:bg-background py-20 lg:pt-40">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="flex flex-col justify-center">
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
                    {body && (
                        <div className="text-lg mt-6 animate-fade-up [animation-delay:300ms] opacity-0">
                            <PortableTextRenderer value={body} />
                        </div>
                    )}
                    {links && links.length > 0 && (
                        <div className="mt-10 flex flex-wrap gap-4 animate-fade-up [animation-delay:400ms] opacity-0">
                            {links.map((link) => (
                                <Button
                                    key={link.title}
                                    variant={stegaClean(link?.buttonVariant)}
                                    asChild
                                >
                                    <Link
                                        href={link.href as string}
                                        target={link.target ? "_blank" : undefined}
                                        rel={link.target ? "noopener" : undefined}
                                    >
                                        {link.title}
                                    </Link>
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex flex-col justify-center">
                    {image && image.asset?._id && (
                        <Image
                            className="rounded-xl animate-fade-up [animation-delay:500ms] opacity-0"
                            src={urlFor(image).url()}
                            alt={image.alt || ""}
                            width={image.asset?.metadata?.dimensions?.width || 800}
                            height={image.asset?.metadata?.dimensions?.height || 800}
                            placeholder={image?.asset?.metadata?.lqip ? "blur" : undefined}
                            blurDataURL={image?.asset?.metadata?.lqip || ""}
                            quality={100}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

// import { Button } from "@/components/ui/button";
// import Link from 'next/link'; // Use next-intl Link: "@/i18n/navigation";
// import Image from "next/image";
// import { urlFor } from "@/sanity/lib/image";
// import { stegaClean } from "next-sanity";
// import PortableTextRenderer from "@/components/portable-text-renderer";
// import { PAGE_QUERYResult } from "@/sanity.types";
// import { getLocalizedValue } from '@/utils/i18n-helpers';
// import { cn } from "@/lib/utils";
//
// type Hero1Props = Extract<
// NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number],
// { _type: "hero-1" }
// > & {
//     locale?: string;
//     isRTL?: boolean;
// };
//
// export default function Hero1({
//                                   tagLine,
//                                   title,
//                                   body,
//                                   image,
//                                   links,
//                                   locale = 'en',
//                                   isRTL = false,
//                               }: Hero1Props) {
//     // Get localized content with fallbacks
//     const localizedTagLine = getLocalizedValue(tagLine, locale);
//     const localizedTitle = getLocalizedValue(title, locale);
//
//     // Handle localized body content
//     const localizedBody = Array.isArray(body)
//         ? body
//         : (body?.[locale] || body?.['en'] || []);
//
//     return (
//         <div className={cn(
//             "container dark:bg-background py-20 lg:pt-40",
//             isRTL ? "text-right" : "text-left"
//         )}>
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
//                 <div className="flex flex-col justify-center">
//                     {localizedTagLine && (
//                         <h1 className="leading-[0] font-sans animate-fade-up [animation-delay:100ms] opacity-0">
//                             <span className="text-base font-semibold">{localizedTagLine}</span>
//                         </h1>
//                     )}
//                     {localizedTitle && (
//                         <h2 className="mt-6 font-bold leading-[1.1] text-4xl md:text-5xl lg:text-6xl animate-fade-up [animation-delay:200ms] opacity-0">
//                             {localizedTitle}
//                         </h2>
//                     )}
//                     {localizedBody && (
//                         <div className="text-lg mt-6 animate-fade-up [animation-delay:300ms] opacity-0">
//                             <PortableTextRenderer
//                                 value={localizedBody}
//                                 locale={locale}
//                                 isRTL={isRTL}
//                             />
//                         </div>
//                     )}
//                     {links && links.length > 0 && (
//                         <div className={cn(
//                             "mt-10 flex flex-wrap gap-4 animate-fade-up [animation-delay:400ms] opacity-0",
//                             isRTL ? "justify-start" : undefined
//                         )}>
//                             {links.map((link) => {
//                                 const linkTitle = getLocalizedValue(link.title, locale);
//                                 return (
//                                     <Button
//                                         key={linkTitle}
//                                         variant={stegaClean(link?.buttonVariant)}
//                                         asChild
//                                     >
//                                         <Link
//                                             href={link.href as string}
//                                             target={link.target ? "_blank" : undefined}
//                                             rel={link.target ? "noopener" : undefined}
//                                         >
//                                             {linkTitle}
//                                         </Link>
//                                     </Button>
//                                 );
//                             })}
//                         </div>
//                     )}
//                 </div>
//                 <div className="flex flex-col justify-center">
//                     {image && image.asset?._id && (
//                         <Image
//                             className="rounded-xl animate-fade-up [animation-delay:500ms] opacity-0"
//                             src={urlFor(image).url()}
//                             alt={getLocalizedValue(image.alt, locale) || ""}
//                             width={image.asset?.metadata?.dimensions?.width || 800}
//                             height={image.asset?.metadata?.dimensions?.height || 800}
//                             placeholder={image?.asset?.metadata?.lqip ? "blur" : undefined}
//                             blurDataURL={image?.asset?.metadata?.lqip || ""}
//                             quality={100}
//                         />
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// }

