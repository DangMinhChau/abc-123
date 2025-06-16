import { ProductVariant } from 'src/product/variants/entities/variant.entity';
import { BaseEntity } from 'src/common/classes/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { Product } from 'src/product/products/entities/product.entity';
import { Collection } from 'src/product/collections/entities/collection.entity';

@Entity('images')
export class Image extends BaseEntity {
  @OneToOne(() => Product, (product) => product.image, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => ProductVariant, (variant) => variant.images, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant;

  @ManyToOne(() => Collection, (collection) => collection.images, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'collection_id' })
  collection: Collection;

  @Column({ name: 'alt_text', length: 255 })
  altText?: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ name: 'image_url', length: 255 })
  imageUrl: string;

  @Column({ name: 'public_id', length: 255 })
  publicId: string;

  @Column({ name: 'is_primary', default: false })
  isPrimary: boolean;
}
