import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMaterialDto {
  @ApiProperty({
    description: 'Material name',
    example: 'Cotton',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Material description',
    example: 'High quality cotton fabric',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Care instructions for the material',
    example: 'Machine wash cold, tumble dry low',
  })
  @IsString()
  @IsOptional()
  careinstructions?: string;

  @ApiProperty({
    description: 'Whether the material is active',
    example: true,
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
