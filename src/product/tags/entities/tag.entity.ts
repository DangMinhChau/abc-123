import { Product } from 'src/product/products/entities/product.entity';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
} from 'typeorm';
import slugify from 'slugify';
import { BaseEntity } from 'src/common/classes/base.entity';

@Entity('tags')
export class Tag extends BaseEntity {
  @Column({ length: 50 })
  name: string;

  @Column({ length: 255 })
  description: string;

  @Column({ length: 50, unique: true })
  slug: string;

  @ManyToMany(() => Product, (Product) => Product.tags)
  @JoinTable({
    name: 'tag_products',
    joinColumn: { name: 'tag_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'product_id', referencedColumnName: 'id' },
  })
  products: Product[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @BeforeInsert()
  @BeforeUpdate()
  generateSlug() {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      locale: 'vi',
    });
  }
}
