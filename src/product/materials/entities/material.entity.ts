import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
} from 'typeorm';
import { BaseEntity } from 'src/common/classes/base.entity';
import { Product } from 'src/product/products/entities/product.entity';
import slugify from 'slugify';

@Entity('materials')
export class Material extends BaseEntity {
  @Column({ name: 'material_name', length: 100 })
  name: string;

  @Column({ length: 255, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'care_instructions', type: 'text', nullable: true })
  careinstructions: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToMany(() => Product, (product) => product.materials)
  @JoinTable({
    name: 'material_products',
    joinColumn: { name: 'material_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'product_id', referencedColumnName: 'id' },
  })
  products: Product[];

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
