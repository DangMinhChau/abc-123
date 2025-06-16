// interfaces/raw-query-results.interface.ts

export interface ColorQueryResult {
  code: string;
  name: string;
  hexCode: string;
  productCount: string; // SQL COUNT returns string
}

export interface SizeQueryResult {
  name: string;
  productCount: string; // SQL COUNT returns string
}

export interface MaterialQueryResult {
  slug: string;
  name: string;
  productCount: string; // SQL COUNT returns string
}

export interface CollectionQueryResult {
  slug: string;
  name: string;
  productCount: string; // SQL COUNT returns string
}

export interface StyleQueryResult {
  slug: string;
  name: string;
  productCount: string; // SQL COUNT returns string
}

export interface TagQueryResult {
  slug: string;
  name: string;
  productCount: string; // SQL COUNT returns string
}

export interface PriceRangeQueryResult {
  minPrice: string; // SQL MIN/MAX returns string
  maxPrice: string; // SQL MIN/MAX returns string
}
