export type NewsCategory =
  | "Technology"
  | "Nature"
  | "Culture"
  | "Science"
  | "Business"
  | "Environment"
  | "Art"
  | "Education"
  | "Weather"
  | "Media"
  | "Food"
  | "Sports"
  | "History"
  | "Transport"
  | "Ocean"
  | "Health"
  | "Politics"
  | "Other";

export interface NewsItem {
  id: string;
  city: string;
  country: string;
  category: NewsCategory;
  title: string;
  summary: string;
  timeZone: string;
  gradient: string;
  glyph: string;
  url?: string;
  imageUrl?: string;
  publishedAt?: string;
}

export interface NewsApiResponse {
  items: NewsItem[];
  source: "api" | "cache" | "sample";
  fetchedAt: string;
}
