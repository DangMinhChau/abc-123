import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ModerateReviewDto {
  @ApiPropertyOptional({
    description: 'Mark review as verified or unverified',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Mark review as active or inactive',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
