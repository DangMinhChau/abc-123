import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type, Expose } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CartQueryDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @Expose()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @Expose()
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Search by user ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  @Expose()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filter by cart status (empty/non-empty)',
    example: 'non-empty',
    enum: ['empty', 'non-empty'],
  })
  @IsOptional()
  @IsString()
  @Expose()
  status?: 'empty' | 'non-empty';
}
