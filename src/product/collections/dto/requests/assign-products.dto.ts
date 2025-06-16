import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class AssignProductsDto {
  @ApiProperty({
    description: 'Array of product IDs to assign to collection',
    example: [
      '123e4567-e89b-12d3-a456-426614174000',
      '987f6543-e21c-34d5-b678-123456789abc',
    ],
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  productIds: string[];
}
