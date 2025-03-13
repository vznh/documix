export interface EmbeddedContentItem {
  embedded: boolean;
  content?: number[];
  url: string;
  title: string;
}

export interface ContentItem {
  content: string;
  url: string;
  title: string;
}
