export type SiteConfig = {
  siteName: string;
  baseUrl: string;
  defaultAuthor: string;
  defaultLocation: string;
  supportEmail: string;
  privacyEmail: string;
  editorsEmail: string;
  lastUpdatedISO: string;
};

export type StaticPage = {
  id: string;
  slug: string;
  title: string;
  metaDescription: string;
  lastUpdatedISO: string;
  bodyMarkdown: string;
};

export type KnowledgeGuide = {
  id: string;
  slug: string;
  url: string;
  title: string;
  metaDescription: string;
  author: string;
  lastUpdatedISO: string;
  tags: string[];
  bodyMarkdown: string;
};

export type KnowledgeIndexCopy = {
  title: string;
  metaDescription: string;
  heroMarkdown: string;
};

export const DOTING_CONTENT: {
  organization: {
    name: string;
    tagline: string;
    description: string;
    disclaimer: string;
  };
};
export const siteConfig: SiteConfig;
export const staticPages: StaticPage[];
export const knowledgeGuides: KnowledgeGuide[];
export const knowledgeIndexCopy: KnowledgeIndexCopy;
export const sitemapEntries: [string, string, string][];
