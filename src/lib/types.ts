export interface Event {
  id: string;
  date: string;
  title: string;
  summary: string;
  description?: string;
  readMoreUrl?: string;
  tags: string[];
  imageUrl: string;
  isBookmarked: boolean;
}
