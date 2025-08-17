export interface Event {
  id: string;
  date: string;
  title: string;
  summary: string;
  tags: string[];
  imageUrl: string;
  isBookmarked: boolean;
}
