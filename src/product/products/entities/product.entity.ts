import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Collection } from '../../collections/entities/collection.entity';
import { Style } from 'src/product/styles/entities/style.entity';
import { BaseEntity } from 'src/common/classes/base.entity';
import slugify from 'slugify';
import { Category } from 'src/product/categories/entities/category.entity';
import { Material } from 'src/product/materials/entities/material.entity';
import { ProductVariant } from 'src/product/variants/entities/variant.entity';
import { Tag } from 'src/product/tags/entities/tag.entity';
import { Review } from 'src/review/reviews/entities/review.entity';
import { Image } from 'src/media/images/entities/image.entity';

@Entity('products')
export class Product extends BaseEntity {
  @Column({ name: 'product_name', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;
  @Column({ name: 'price', type: 'decimal', precision: 18, scale: 3 })
  basePrice: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  discountPercent: number; // 20 = 20% discount

  @ManyToOne(() => Category, (category) => category.products, {
    nullable: false,
    eager: true,
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToMany(() => Collection, (collection) => collection.products, {
    nullable: true,
    eager: true,
  })
  collections: Collection[];

  @ManyToMany(() => Style, (style) => style.products, {
    nullable: true,
  })
  styles: Style[];

  @ManyToMany(() => Material, (material) => material.products, {
    nullable: true,
  })
  materials: Material[];

  @ManyToMany(() => Tag, (tag) => tag.products)
  tags: Tag[];

  @Column({ unique: true, length: 20 })
  baseSku: string;

  @OneToOne(() => Image, (image) => image.product, {
    onDelete: 'CASCADE',
    eager: true,
  })
  image: Image;

  @Column({ length: 255, unique: true })
  slug: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => ProductVariant, (variant) => variant.product, {
    eager: true,
  })
  variants: ProductVariant[];

  @OneToMany(() => Review, (review) => review.product)
  reviews: Review[];

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @Column({ default: 0 })
  totalReviews: number;

  @BeforeInsert()
  @BeforeUpdate()
  generateSlug() {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      locale: 'vi',
    });
  }
  calculateActualPrice(): number {
    const discountValue = this.discountPercent || 0;
    return this.basePrice * (1 - discountValue / 100);
  }
}
