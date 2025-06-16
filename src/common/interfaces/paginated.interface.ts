export interface PaginationMeta {
  timestamp: string;
  page: number;
  limit: number;
  total: number;
  // Additional meta properties for search and other features
  [key: string]: any;
}

export interface PaginatedResponse<T> {
  statusCode: number;
  message: string;
  data: T[];
  meta: PaginationMeta;
  errors: null;
}

// Specialized meta interface for search results
export interface SearchPaginationMeta extends PaginationMeta {
  searchTerm: string;
  highlighted?: boolean;
}

// Enhanced paginated response for search
export interface SearchPaginatedResponse<T> {
  statusCode: number;
  message: string;
  data: T[];
  meta: SearchPaginationMeta;
  errors: null;
}
