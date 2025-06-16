import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, IsEnum, IsOptional, IsString } from 'class-validator';

export class BulkVerifyDto {
  @ApiProperty({
    description: 'Array of review IDs to verify',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  reviewIds: string[];
}

export class BulkDeleteDto {
  @ApiProperty({
    description: 'Array of review IDs to delete',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  reviewIds: string[];
}

export class ModerateReviewDto {
  @ApiProperty({
    description: 'Moderation action',
    enum: ['approve', 'reject', 'flag'],
    example: 'approve',
  })
  @IsEnum(['approve', 'reject', 'flag'])
  action: 'approve' | 'reject' | 'flag';

  @ApiProperty({
    description: 'Moderation reason',
    example: 'Content violates community guidelines',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
