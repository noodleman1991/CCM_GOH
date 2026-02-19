export interface HomepageData {
  _id: string;
  title?: string;
  slug: {
    current: string;
  };
  language?: string;
  welcomeHero?: any;
  globalAgendaSection?: any;
  howToUseSection?: any;
  agendasModule?: any;
  livedExperiencesModule?: any;
  regionalCommunitiesModule?: any;
  collaborationSection?: any;
  newsModule?: any;
  projectInfoSection?: any;
  mentalHealthSection?: any;
  partnerLogos?: any;
  blocks?: any[];
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
