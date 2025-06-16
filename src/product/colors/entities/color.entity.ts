import { Exclude } from 'class-transformer';
import { BaseEntity } from 'src/common/classes/base.entity';
import { ProductVariant } from 'src/product/variants/entities/variant.entity';
import { Column, Entity, OneToMany } from 'typeorm';

@Entity('colors')
export class Color extends BaseEntity {
  @Column({ name: 'color_name', length: 50, unique: true })
  name: string;

  @Column({ length: 40, unique: true })
  code: string;

  @Column({ name: 'hex_code', length: 7, unique: true })
  hexCode: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => ProductVariant, (productVariant) => productVariant.color)
  variants: ProductVariant[];
}
