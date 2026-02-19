export type Translation = {
    language: string;
    path: string;
    title: string;
};

// Update your Sanity types to include localized fields
export interface LocalizedString {
    en: string;
    fr?: string;
    es?: string;
    ar?: string;
    [key: string]: string | undefined;
}

export interface LocalizedSlug {
    en: { current: string };
    fr?: { current: string };
    es?: { current: string };
    ar?: { current: string };
    [key: string]: { current: string } | undefined;
}
