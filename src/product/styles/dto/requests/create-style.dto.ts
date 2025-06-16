import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStyleDto {
  @ApiProperty({
    description: 'Style name',
    example: 'Minimalist',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Style description',
    example: 'Clean and simple design style',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Whether the style is active',
    example: true,
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
