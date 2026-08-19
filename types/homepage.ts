/** A Sanity block/section object: `_type` plus the block's own fields. */
export interface HomepageBlock {
  _type: string;
  _key?: string;
  [key: string]: unknown;
}

export interface HomepageData {
  _id: string;
  title?: string;
  slug: {
    current: string;
  };
  language?: string;
  welcomeHero?: HomepageBlock;
  globalAgendaSection?: HomepageBlock;
  howToUseSection?: HomepageBlock;
  agendasModule?: HomepageBlock;
  livedExperiencesModule?: HomepageBlock;
  regionalCommunitiesModule?: HomepageBlock;
  collaborationSection?: HomepageBlock;
  newsModule?: HomepageBlock;
  projectInfoSection?: HomepageBlock;
  mentalHealthSection?: HomepageBlock;
  partnerLogos?: HomepageBlock;
  blocks?: HomepageBlock[];
  meta_title?: string;
  meta_description?: string;
  noindex?: boolean;
  ogImage?: {
    asset?: {
      _id: string;
      url: string;
      metadata?: {
        dimensions?: {
          width: number;
          height: number;
        };
      };
    };
    alt?: string;
  };
}

export interface HomepageProps {
  homepage: HomepageData | null;
  locale?: string;
}
