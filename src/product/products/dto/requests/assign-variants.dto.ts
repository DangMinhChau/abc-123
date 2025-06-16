import { IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignVariantsDto {
  @ApiProperty({
    description: 'Array of variant IDs to assign to the product',
    example: ['variant-uuid-1', 'variant-uuid-2'],
  })
  @IsArray()
  @IsUUID('all', { each: true })
  variantIds: string[];
}
