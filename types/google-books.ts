export interface GoogleBooksIndustryIdentifier {
  type: string;
  identifier: string;
}

export interface GoogleBooksVolume {
  id: string;
  volumeInfo: {
    title: string;
    subtitle?: string;
    authors?: string[];
    categories?: string[];
    description?: string;
    publishedDate?: string;
    pageCount?: number;
    publisher?: string;
    language?: string;
    industryIdentifiers?: GoogleBooksIndustryIdentifier[];
    averageRating?: number;
    ratingsCount?: number;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
  };
}

export interface GoogleBooksSearchResponse {
  items?: GoogleBooksVolume[];
  totalItems: number;
}
