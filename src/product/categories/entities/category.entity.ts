import slugify from 'slugify';
import { Exclude } from 'class-transformer';
import { BaseEntity } from 'src/common/classes/base.entity';
import { Product } from 'src/product/products/entities/product.entity';
import { Size } from 'src/product/sizes/entities/size.entity';
import {
  Entity,
  Column,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
  TreeParent,
  TreeChildren,
  Tree,
} from 'typeorm';

@Entity('categories')
@Tree('closure-table')
export class Category extends BaseEntity {
  @Column({ name: 'category_name', length: 100, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 100, unique: true })
  slug: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];

  @TreeParent({ onDelete: 'SET NULL' })
  parent: Category;

  @TreeChildren()
  children: Category[];

  @OneToMany(() => Size, (size) => size.category)
  sizes: Size[];

  @BeforeInsert()
  @BeforeUpdate()
  generateSlug() {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      trim: true,
      locale: 'vi',
    });
  }
}
