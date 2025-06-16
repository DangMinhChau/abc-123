import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateTagDto {
  @ApiProperty({
    description: 'Tag name',
    example: 'Casual',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  name: string;

  @ApiProperty({
    description: 'Tag description',
    example: 'Casual style for everyday wear',
    maxLength: 200,
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 200)
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Is tag active?',
    example: true,
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
