import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewQueryDto } from './dto/review-query.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { Review } from './entities/review.entity';
import { User } from 'src/user/users/entities/user.entity';
import { Order } from 'src/order/orders/entities/order.entity';
import { OrderStatus } from 'src/common/constants/order-status.enum';
import { UserRole } from 'src/common/constants/user-role.enum';
import { ProductsService } from 'src/product/products/products.service';
import {
  ReviewStatsQuery,
  ReviewDistributionQuery,
  TopRatedProductQuery,
  ReviewResponse,
  PaginatedReviews,
  ReviewStats,
  ReviewAnalytics,
  ModerationSummary,
  BulkOperationResult,
  ProductReviewSummary,
} from './interfaces/review.interface';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly productsService: ProductsService,
  ) {}

  async create(
    createReviewDto: CreateReviewDto,
    userId: string,
  ): Promise<ReviewResponse> {
    const { productId, rating, comment } = createReviewDto;

    // Validate user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Use ProductsService to validate product exists
    const productInfo =
      await this.productsService.getProductBasicInfo(productId);
    if (!productInfo) {
      throw new NotFoundException('Product not found');
    }

    // Check if user already reviewed this product
    const existingReview = await this.reviewRepository.findOne({
      where: { user: { id: userId }, product: { id: productId } },
    });

    if (existingReview) {
      throw new ConflictException('You have already reviewed this product');
    }

    // Check if user has purchased this product
    const hasPurchased = await this.checkUserPurchaseHistory(userId, productId);

    // Create review
    const review = this.reviewRepository.create({
      user: { id: userId },
      product: { id: productId },
      rating,
      comment,
      isVerified: hasPurchased, // Verify if user purchased the product
      isActive: true,
    });
    const savedReview = await this.reviewRepository.save(review);

    // Update product rating statistics
    await this.updateProductRatingStats(productId);

    // Fetch the complete review with relations for response
    const completeReview = await this.reviewRepository.findOne({
      where: { id: savedReview.id },
      relations: ['user', 'product'],
    });

    if (!completeReview) {
      throw new NotFoundException('Review not found after creation');
    }

    return completeReview.toResponseObject();
  }

  async findAll(reviewQueryDto: ReviewQueryDto): Promise<PaginatedReviews> {
    const {
      page = 1,
      limit = 10,
      productId,
      userId,
      rating,
      isVerified,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = reviewQueryDto;

    const queryBuilder = this.createQueryBuilder();

    // Apply filters
    if (productId) {
      queryBuilder.andWhere('review.product.id = :productId', { productId });
    }

    if (userId) {
      queryBuilder.andWhere('review.user.id = :userId', { userId });
    }

    if (rating !== undefined) {
      queryBuilder.andWhere('review.rating = :rating', { rating });
    }

    if (isVerified !== undefined) {
      queryBuilder.andWhere('review.isVerified = :isVerified', { isVerified });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('review.isActive = :isActive', { isActive });
    }

    // Apply sorting
    if (sortBy && sortOrder) {
      queryBuilder.orderBy(
        `review.${sortBy}`,
        sortOrder.toUpperCase() as 'ASC' | 'DESC',
      );
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [reviews, total] = await queryBuilder.getManyAndCount();

    return {
      data: reviews.map((review) => review.toResponseObject()),
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async findOne(id: string): Promise<ReviewResponse> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user', 'product'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review.toResponseObject();
  }

  async update(
    id: string,
    updateReviewDto: UpdateReviewDto,
    userId: string,
    userRole: UserRole,
  ): Promise<ReviewResponse> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user', 'product'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Check if user owns the review or is admin
    if (review.user.id !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    // Update fields
    if (updateReviewDto.rating !== undefined) {
      review.rating = updateReviewDto.rating;
    }
    if (updateReviewDto.comment !== undefined) {
      review.comment = updateReviewDto.comment;
    }

    await this.reviewRepository.save(review);

    // Update product rating statistics if rating changed
    if (updateReviewDto.rating !== undefined) {
      await this.updateProductRatingStats(review.product.id);
    }

    return review.toResponseObject();
  }
  async remove(
    id: string,
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user', 'product'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const productId = review.product.id;
    await this.reviewRepository.remove(review);

    // Update product rating statistics
    await this.updateProductRatingStats(productId);

    return {
      success: true,
      message: 'Đánh giá đã được xóa thành công',
    };
  }

  async moderateReview(
    id: string,
    moderateDto: ModerateReviewDto,
    userId: string,
    userRole: UserRole,
  ): Promise<ReviewResponse> {
    // Only admins can moderate reviews
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can moderate reviews');
    }

    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user', 'product'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Update verification status if provided
    if (moderateDto.isVerified !== undefined) {
      review.isVerified = moderateDto.isVerified;
    }

    // Update active status if provided
    if (moderateDto.isActive !== undefined) {
      review.isActive = moderateDto.isActive;
    }

    await this.reviewRepository.save(review);

    // Update product rating statistics if status changed
    if (moderateDto.isActive !== undefined) {
      await this.updateProductRatingStats(review.product.id);
    }

    return review.toResponseObject();
  }

  async getReviewAnalytics(): Promise<ReviewAnalytics> {
    // Get total reviews and average rating
    const totalResult = (await this.reviewRepository
      .createQueryBuilder('review')
      .select([
        'COUNT(*) as totalReviews',
        'AVG(review.rating) as averageRating',
      ])
      .where('review.isActive = :isActive', { isActive: true })
      .getRawOne()) as ReviewStatsQuery; // Get top-rated products (simplified version)
    const topRatedProducts = await this.reviewRepository
      .createQueryBuilder('review')
      .select([
        'product.id as productId',
        'product.name as productName',
        'AVG(review.rating) as averageRating',
        'COUNT(review.id) as totalReviews',
      ])
      .innerJoin('review.product', 'product')
      .where('review.isActive = :isActive', { isActive: true })
      .groupBy('product.id, product.name')
      .having('COUNT(review.id) >= 5') // Only products with at least 5 reviews
      .orderBy('averageRating', 'DESC')
      .limit(10)
      .getRawMany();

    // Get review distribution
    const reviewDistribution = (await this.reviewRepository
      .createQueryBuilder('review')
      .select([
        'SUM(CASE WHEN review.isVerified = true THEN 1 ELSE 0 END) as verified',
        'SUM(CASE WHEN review.isVerified = false THEN 1 ELSE 0 END) as unverified',
        'SUM(CASE WHEN review.isActive = true THEN 1 ELSE 0 END) as active',
        'SUM(CASE WHEN review.isActive = false THEN 1 ELSE 0 END) as inactive',
      ])
      .getRawOne()) as ReviewDistributionQuery;

    return {
      totalReviews: parseInt(totalResult?.totalReviews || '0', 10),
      averageRating: parseFloat(totalResult?.averageRating || '0'),
      ratingTrends: [], // Simplified - would need time-based analysis
      topRatedProducts: topRatedProducts.map((product) => ({
        productId: product.productId,
        productName: product.productName,
        averageRating: parseFloat(product.averageRating),
        totalReviews: parseInt(product.totalReviews, 10),
      })),
      reviewDistribution: {
        verified: parseInt(reviewDistribution?.verified || '0', 10),
        unverified: parseInt(reviewDistribution?.unverified || '0', 10),
        active: parseInt(reviewDistribution?.active || '0', 10),
        inactive: parseInt(reviewDistribution?.inactive || '0', 10),
      },
    };
  }

  async getModerationSummary(): Promise<ModerationSummary> {
    const pendingReviews = await this.reviewRepository.count({
      where: { isVerified: false, isActive: true },
    });

    const recentReviews = await this.reviewRepository.count({
      where: { isActive: true },
    });

    return {
      pendingReviews,
      flaggedReviews: 0, // Simplified - would need flagging system
      recentReviews,
    };
  }

  async getUserReviews(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedReviews> {
    const queryBuilder = this.createQueryBuilder()
      .where('review.user.id = :userId', { userId })
      .orderBy('review.createdAt', 'DESC');

    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [reviews, total] = await queryBuilder.getManyAndCount();

    return {
      data: reviews.map((review) => review.toResponseObject()),
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  // Admin/Moderator methods
  async bulkVerifyReviews(reviewIds: string[]): Promise<BulkOperationResult> {
    const result = await this.reviewRepository
      .createQueryBuilder()
      .update(Review)
      .set({ isVerified: true })
      .whereInIds(reviewIds)
      .execute();

    return { updated: result.affected || 0 };
  }

  async bulkDeleteReviews(reviewIds: string[]): Promise<BulkOperationResult> {
    const result = await this.reviewRepository.delete(reviewIds);
    return { deleted: result.affected || 0 };
  }

  // Integration methods for other modules
  async canUserReviewProduct(
    userId: string,
    productId: string,
  ): Promise<boolean> {
    // Check if user has purchased the product
    const hasPurchased = await this.checkUserPurchaseHistory(userId, productId);
    if (!hasPurchased) return false;

    // Check if user hasn't already reviewed this product
    const existingReview = await this.reviewRepository.findOne({
      where: { user: { id: userId }, product: { id: productId } },
    });

    return !existingReview;
  }

  async getProductStats(productId: string): Promise<ReviewStats> {
    const stats = (await this.reviewRepository
      .createQueryBuilder('review')
      .select([
        'COUNT(*) as totalReviews',
        'AVG(review.rating) as averageRating',
        'SUM(CASE WHEN review.rating = 1 THEN 1 ELSE 0 END) as oneStarCount',
        'SUM(CASE WHEN review.rating = 2 THEN 1 ELSE 0 END) as twoStarCount',
        'SUM(CASE WHEN review.rating = 3 THEN 1 ELSE 0 END) as threeStarCount',
        'SUM(CASE WHEN review.rating = 4 THEN 1 ELSE 0 END) as fourStarCount',
        'SUM(CASE WHEN review.rating = 5 THEN 1 ELSE 0 END) as fiveStarCount',
      ])
      .where('review.product.id = :productId', { productId })
      .andWhere('review.isActive = :isActive', { isActive: true })
      .getRawOne()) as ReviewStatsQuery;

    return {
      totalReviews: parseInt(stats?.totalReviews || '0', 10),
      averageRating: parseFloat(stats?.averageRating || '0'),
      ratingDistribution: {
        1: parseInt(stats?.oneStarCount || '0', 10),
        2: parseInt(stats?.twoStarCount || '0', 10),
        3: parseInt(stats?.threeStarCount || '0', 10),
        4: parseInt(stats?.fourStarCount || '0', 10),
        5: parseInt(stats?.fiveStarCount || '0', 10),
      },
    };
  }

  async getProductReviewSummary(
    productId: string,
  ): Promise<ProductReviewSummary> {
    // Get product basic info
    const productInfo =
      await this.productsService.getProductBasicInfo(productId);
    if (!productInfo) {
      throw new NotFoundException('Product not found');
    }

    // Get review statistics
    const stats = await this.getProductStats(productId);

    // Get recent reviews (last 5 reviews)
    const recentReviews = await this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('review.product', 'product')
      .where('review.product.id = :productId', { productId })
      .andWhere('review.isActive = :isActive', { isActive: true })
      .orderBy('review.createdAt', 'DESC')
      .limit(5)
      .getMany();

    // Get top-rated reviews (highest rated reviews)
    const topReviews = await this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('review.product', 'product')
      .where('review.product.id = :productId', { productId })
      .andWhere('review.isActive = :isActive', { isActive: true })
      .andWhere('review.rating >= :minRating', { minRating: 4 })
      .orderBy('review.rating', 'DESC')
      .addOrderBy('review.createdAt', 'DESC')
      .limit(5)
      .getMany();

    return {
      stats,
      recentReviews: recentReviews.map((review) => review.toResponseObject()),
      topReviews: topReviews.map((review) => review.toResponseObject()),
      productInfo: {
        id: productInfo.id,
        name: productInfo.name,
        slug: productInfo.slug,
      },
    };
  }
  async getAnalytics(): Promise<ReviewAnalytics> {
    const [totalReviews, avgRating, verified, active] = await Promise.all([
      this.reviewRepository.count(),
      this.reviewRepository
        .createQueryBuilder('review')
        .select('AVG(review.rating)', 'average')
        .getRawOne(),
      this.reviewRepository.count({ where: { isVerified: true } }),
      this.reviewRepository.count({ where: { isActive: true } }),
    ]);

    const topRatedProducts = await this.reviewRepository
      .createQueryBuilder('review')
      .leftJoin('review.product', 'product')
      .select([
        'product.id as productId',
        'product.name as productName',
        'AVG(review.rating) as averageRating',
        'COUNT(review.id) as totalReviews',
      ])
      .where('review.isActive = :isActive', { isActive: true })
      .groupBy('product.id')
      .orderBy('averageRating', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      totalReviews,
      averageRating: parseFloat(avgRating?.average || '0'),
      ratingTrends: [],
      topRatedProducts: topRatedProducts.map((product: any) => ({
        productId: product.productId,
        productName: product.productName,
        averageRating: parseFloat(product.averageRating),
        totalReviews: parseInt(product.totalReviews, 10),
      })),
      reviewDistribution: {
        verified,
        unverified: totalReviews - verified,
        active,
        inactive: totalReviews - active,
      },
    };
  }

  async findByUserId(userId: string, query?: any): Promise<PaginatedReviews> {
    const queryBuilder = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.product', 'product')
      .leftJoinAndSelect('review.user', 'user')
      .where('user.id = :userId', { userId });

    if (query?.rating) {
      queryBuilder.andWhere('review.rating = :rating', {
        rating: query.rating,
      });
    }

    if (query?.productId) {
      queryBuilder.andWhere('product.id = :productId', {
        productId: query.productId,
      });
    }

    queryBuilder.orderBy('review.createdAt', 'DESC');

    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const [reviews, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: reviews.map((review) => review.toResponseObject()),
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async canUserReview(
    userId: string,
    productId: string,
  ): Promise<{ canReview: boolean; reason?: string }> {
    // Check if user already reviewed this product
    const existingReview = await this.reviewRepository
      .createQueryBuilder('review')
      .leftJoin('review.user', 'user')
      .leftJoin('review.product', 'product')
      .where('user.id = :userId', { userId })
      .andWhere('product.id = :productId', { productId })
      .getOne();

    if (existingReview) {
      return {
        canReview: false,
        reason: 'User has already reviewed this product',
      };
    }

    // Check if user has purchased this product
    const purchasedOrder = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.items', 'item')
      .leftJoin('item.product', 'product')
      .where('order.userId = :userId', { userId })
      .andWhere('product.id = :productId', { productId })
      .andWhere('order.status = :status', { status: OrderStatus.COMPLETED })
      .getOne();

    if (!purchasedOrder) {
      return {
        canReview: false,
        reason: 'User must purchase the product before reviewing',
      };
    }

    return { canReview: true };
  }

  async moderate(id: string, moderateReviewDto: any): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user', 'product'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    switch (moderateReviewDto.action) {
      case 'approve':
        review.isVerified = true;
        review.isActive = true;
        break;
      case 'reject':
        review.isActive = false;
        break;
      case 'flag':
        review.isActive = false;
        break;
    }

    return await this.reviewRepository.save(review);
  }

  async bulkVerify(bulkVerifyDto: {
    reviewIds: string[];
  }): Promise<BulkOperationResult> {
    const { reviewIds } = bulkVerifyDto;

    const result = await this.reviewRepository.update(reviewIds, {
      isVerified: true,
      isActive: true,
    });

    return {
      updated: result.affected || 0,
    };
  }

  async bulkDelete(bulkDeleteDto: {
    reviewIds: string[];
  }): Promise<BulkOperationResult> {
    const { reviewIds } = bulkDeleteDto;

    const result = await this.reviewRepository.delete(reviewIds);

    return {
      deleted: result.affected || 0,
    };
  }

  // Private helper methods
  private createQueryBuilder(): SelectQueryBuilder<Review> {
    return this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('review.product', 'product');
  }

  private async checkUserPurchaseHistory(
    userId: string,
    productId: string,
  ): Promise<boolean> {
    const purchaseCount = await this.orderRepository
      .createQueryBuilder('order')
      .innerJoin('order.items', 'orderItem')
      .innerJoin('orderItem.variant', 'variant')
      .innerJoin('variant.product', 'product')
      .where('order.user.id = :userId', { userId })
      .andWhere('product.id = :productId', { productId })
      .andWhere('order.status = :status', { status: OrderStatus.COMPLETED })
      .getCount();

    return purchaseCount > 0;
  }

  private async updateProductRatingStats(productId: string): Promise<void> {
    const stats = (await this.reviewRepository
      .createQueryBuilder('review')
      .select([
        'AVG(review.rating) as averageRating',
        'COUNT(*) as totalReviews',
      ])
      .where('review.product.id = :productId', { productId })
      .andWhere('review.isActive = :isActive', { isActive: true })
      .getRawOne()) as { averageRating: string; totalReviews: string };

    const averageRating = parseFloat(stats?.averageRating || '0');
    const totalReviews = parseInt(stats?.totalReviews || '0', 10);

    await this.productsService.updateProductRatingStats(
      productId,
      averageRating,
      totalReviews,
    );
  }
}
