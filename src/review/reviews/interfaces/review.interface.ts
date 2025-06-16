// Type interfaces for raw query results from database queries
export interface ReviewStatsQuery {
  totalReviews: string;
  averageRating: string;
  oneStarCount?: string;
  twoStarCount?: string;
  threeStarCount?: string;
  fourStarCount?: string;
  fiveStarCount?: string;
}

export interface ReviewDistributionQuery {
  verified: string;
  unverified: string;
  active: string;
  inactive: string;
}

export interface TopRatedProductQuery {
  productId: string;
  productName: string;
  averageRating: string;
  totalReviews: string;
}

export interface ProductRatingStats {
  averageRating: string;
  totalReviews: string;
}

// Response interfaces for service methods
export interface ReviewResponse {
  id: string;
  rating: number;
  comment: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  user: {
    id: string;
    email: string;
    fullName: string;
  };
  product: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface PaginatedReviews {
  data: ReviewResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface ReviewAnalytics {
  totalReviews: number;
  averageRating: number;
  ratingTrends: any[]; // Simplified for now
  topRatedProducts: {
    productId: string;
    productName: string;
    averageRating: number;
    totalReviews: number;
  }[];
  reviewDistribution: {
    verified: number;
    unverified: number;
    active: number;
    inactive: number;
  };
}

export interface ModerationSummary {
  pendingReviews: number;
  flaggedReviews: number;
  recentReviews: number;
}

export interface BulkOperationResult {
  updated?: number;
  deleted?: number;
}

export interface ProductReviewSummary {
  stats: ReviewStats;
  recentReviews: ReviewResponse[];
  topReviews: ReviewResponse[];
  productInfo: {
    id: string;
    name: string;
    slug: string;
  };
}
