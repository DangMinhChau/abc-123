import { Product } from 'src/product/products/entities/product.entity';
import { User } from 'src/user/users/entities/user.entity';
import { BaseEntity } from 'src/common/classes/base.entity';
import { ReviewResponse } from '../interfaces/review.interface';
import {
  Column,
  Entity,
  ManyToOne,
  Unique,
  Check,
  Index,
  JoinColumn,
} from 'typeorm';

@Entity('reviews')
@Unique(['user', 'product'])
@Check('CHK_rating_range', 'rating >= 1 AND rating <= 5')
@Index(['product', 'isActive'])
@Index(['rating', 'isActive'])
@Index(['createdAt'])
export class Review extends BaseEntity {
  @ManyToOne(() => Product, (product) => product.reviews, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ManyToOne(() => User, (user) => user.reviews, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'tinyint' })
  rating: number;

  @Column({ type: 'text' })
  comment: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: true })
  isActive: boolean;

  // Method to convert entity to response object
  toResponseObject(): ReviewResponse {
    return {
      id: this.id,
      rating: this.rating,
      comment: this.comment,
      isVerified: this.isVerified,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
      user: {
        id: this.user.id,
        email: this.user.email,
        fullName: this.user.fullName,
      },
      product: {
        id: this.product.id,
        name: this.product.name,
        slug: this.product.slug,
      },
    };
  }
}
