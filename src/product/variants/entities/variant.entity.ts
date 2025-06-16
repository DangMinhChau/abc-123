import { Color } from 'src/product/colors/entities/color.entity';
import { BaseEntity } from 'src/common/classes/base.entity';
import { Size } from 'src/product/sizes/entities/size.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';
import { Product } from 'src/product/products/entities/product.entity';
import { Image } from 'src/media/images/entities/image.entity';

@Entity('product_variants')
@Unique(['product', 'color', 'size'])
export class ProductVariant extends BaseEntity {
  @ManyToOne(() => Product, (product) => product.variants, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
  product: Product;

  @ManyToOne(() => Color, (color) => color.variants, {
    nullable: false,
    eager: true
  })
  @JoinColumn({ name: 'color_id' })
  color: Color;

  @ManyToOne(() => Size, (size) => size.variants, {
    nullable: false,
    eager: true
  })
  @JoinColumn({ name: 'size_id'})
  size: Size;

  @Column({ unique: true })
  sku: string;

  @Column({ name: 'stock_quantity', default: 0 })
  stockQuantity: number;

  @OneToMany(() => Image, (image) => image.variant, {
    nullable: true,
    cascade: true,
    eager: true,
  })
  images: Image[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
