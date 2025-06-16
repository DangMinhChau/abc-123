import { BaseEntity } from 'src/common/classes/base.entity';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import slugify from 'slugify';
import { Product } from 'src/product/products/entities/product.entity';
import { Image } from 'src/media/images/entities/image.entity';

@Entity('collections')
export class Collection extends BaseEntity {
  @Column({ name: 'collection_name', length: 100 })
  name: string;

  @Column({ length: 255, unique: true })
  slug: string;

  @Column({ length: 50 })
  season: string;

  @Column({ type: 'year' })
  year: number;

  @Column({ type: 'text', nullable: true })
  description: string;
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => Image, (image) => image.collection, {
    nullable: true,
  })
  images: Image[];

  @ManyToMany(() => Product, (product) => product.collections)
  @JoinTable({
    name: 'collection_products',
    joinColumn: { name: 'collection_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'product_id', referencedColumnName: 'id' },
  })
  products: Product[];

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
