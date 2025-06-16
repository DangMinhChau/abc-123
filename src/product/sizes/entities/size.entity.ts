import { BaseEntity } from 'src/common/classes/base.entity';
import { Category } from 'src/product/categories/entities/category.entity';
import { ProductVariant } from 'src/product/variants/entities/variant.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';

@Entity('sizes')
@Index(['category', 'isActive'])
@Unique(['category', 'name'])
export class Size extends BaseEntity {
  @Column({ name: 'size_name', length: 20 })
  name: string;

  @Column({ length: 100, nullable: true })
  description: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => Category, (category) => category.sizes, {
    nullable: false,
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => ProductVariant, (variant) => variant.size)
  variants: ProductVariant[];
}
