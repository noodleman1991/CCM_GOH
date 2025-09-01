//todo: is it necessary?
import { PortableTextComponents } from '@portabletext/react';
import { getLocalizedValue } from '@/i18n/i18n-helpers';
import Image from 'next/image';
import { urlFor } from '@/sanity/lib/image';

export const portableTextComponents = (locale: string): PortableTextComponents => ({
    block: {
        normal: ({ children }) => <p className="mb-4">{children}</p>,
        h1: ({ children }) => <h1 className="text-4xl font-bold mb-6">{children}</h1>,
        h2: ({ children }) => <h2 className="text-3xl font-semibold mb-5">{children}</h2>,
        h3: ({ children }) => <h3 className="text-2xl font-semibold mb-4">{children}</h3>,
        h4: ({ children }) => <h4 className="text-xl font-semibold mb-3">{children}</h4>,
        blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-4 italic my-6">
                {children}
            </blockquote>
        ),
        // Custom styles
        lead: ({ children }) => (
            <p className="text-xl leading-relaxed text-muted-foreground mb-6">
                {children}
            </p>
        ),
        caption: ({ children }) => (
            <p className="text-sm text-muted-foreground italic mb-4">
                {children}
            </p>
        ),
        highlight: ({ children }) => (
            <div className="bg-yellow-100 dark:bg-yellow-900/20 p-4 rounded-md mb-4">
                {children}
            </div>
        ),
        infoBox: ({ children }) => (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500 mb-4">
                {children}
            </div>
        ),
        warningBox: ({ children }) => (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border-l-4 border-red-500 mb-4">
                {children}
            </div>
        ),
        successBox: ({ children }) => (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-l-4 border-green-500 mb-4">
                {children}
            </div>
        ),
        sidebarNote: ({ children }) => (
            <aside className="bg-muted p-4 rounded-lg text-sm ml-8 mb-4 border-l-2 border-muted-foreground/20">
                {children}
            </aside>
        ),
        cta: ({ children }) => (
            <div className="bg-primary text-primary-foreground p-6 rounded-lg text-center font-bold mb-4">
                {children}
            </div>
        ),
    },
    list: {
        bullet: ({ children }) => <ul className="list-disc pl-6 mb-4">{children}</ul>,
        number: ({ children }) => <ol className="list-decimal pl-6 mb-4">{children}</ol>,
        checkbox: ({ children }) => (
            <ul className="list-none pl-0 mb-4">
                {children}
            </ul>
        ),
    },
    listItem: {
        bullet: ({ children }) => <li className="mb-2">{children}</li>,
        number: ({ children }) => <li className="mb-2">{children}</li>,
        checkbox: ({ children }) => (
            <li className="flex items-start mb-2">
                <input type="checkbox" className="mr-2 mt-1" disabled />
                <span>{children}</span>
            </li>
        ),
    },
    marks: {
        strong: ({ children }) => <strong className="font-bold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        underline: ({ children }) => <u className="underline">{children}</u>,
        'strike-through': ({ children }) => <s className="line-through">{children}</s>,
        code: ({ children }) => (
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                {children}
            </code>
        ),
        highlight: ({ children }) => (
            <mark className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
                {children}
            </mark>
        ),
        link: ({ value, children }) => {
            const target = value?.target || (value?.href?.startsWith('http') ? '_blank' : undefined);
            return (
                <a
                    href={value?.href}
                    target={target}
                    rel={target === '_blank' ? 'noopener noreferrer' : undefined}
                    className="text-primary underline hover:no-underline"
                >
                    {children}
                </a>
            );
        },
        internalLink: ({ value, children }) => {
            // Handle internal links - you might want to use Next.js Link here
            return (
                <a href={`/${value?.reference?.slug?.current}`} className="text-primary underline hover:no-underline">
                    {children}
                </a>
            );
        },
    },
    types: {
        image: ({ value }) => {
            const alt = getLocalizedValue(value?.alt, locale, 'en') || '';
            const caption = getLocalizedValue(value?.caption, locale, 'en');

            return (
                <figure className="my-6">
                    <Image
                        src={urlFor(value).url()}
                        alt={alt}
                        width={800}
                        height={450}
                        className="rounded-lg w-full"
                    />
                    {caption && (
                        <figcaption className="text-sm text-muted-foreground text-center mt-2">
                            {caption}
                        </figcaption>
                    )}
                </figure>
            );
        },
        youtube: ({ value }) => {
            const caption = getLocalizedValue(value?.caption, locale, 'en');

            return (
                <figure className="my-6">
                    <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-lg">
                        <iframe
                            className="absolute top-0 left-0 w-full h-full"
                            src={`https://www.youtube.com/embed/${value.videoId}`}
                            title="YouTube video"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                    {caption && (
                        <figcaption className="text-sm text-muted-foreground text-center mt-2">
                            {caption}
                        </figcaption>
                    )}
                </figure>
            );
        },
    },
});
