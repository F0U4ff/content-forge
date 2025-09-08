export interface Article {
  id: string;
  content: string;
  wordCount: number;
  keywordDensity: number;
  readingTime: number;
  seoScore: number;
  structureValidation?: { valid: boolean; missing: string[] };
  keywordDensityValid?: boolean;
  title: string;
  createdAt: string;
  primaryKeyword: string;
  selectedKeywords: string[];
}

export interface AppState {
  description: string;
  primaryKeyword: string;
  relevantKeywords: string[];
  suggestedHeadlines: string[];
  suggestedKeywords: string[];
  selectedHeadline: string;
  selectedKeywords: string[];
  isLoadingSuggestions: boolean;
  isGeneratingArticle: boolean;
  isParsingImage: boolean;
  showSuggestions: boolean;
  article: Article | null;
  articleHistory: Article[];
  creativeContext?: {
    marketingHooks?: string[];
    suggestedStructure?: Array<{ title: string; content: string }>;
    emotionalTriggers?: string[];
    targetAudience?: string;
    uniqueSellingPoints?: string[];
    businessVertical?: string;
    keyThemes?: string[];
    extractedKeywords?: {
      primary: string;
      secondary: string[];
      longTail: string[];
    };
  };
}

export interface SuggestionResponse {
  headlines: string[];
  keywords: string[];
}

export interface ArticleResponse {
  article: Omit<Article, 'id' | 'createdAt' | 'primaryKeyword' | 'selectedKeywords'>;
}