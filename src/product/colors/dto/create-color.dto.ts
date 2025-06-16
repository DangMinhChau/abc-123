import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateColorDto {
  @ApiProperty({
    description: 'Name of the color',
    example: 'Đỏ',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Color code',
    example: 'RED',
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Hex color code (7 characters including #)',
    example: '#FF0000',
    minLength: 7,
    maxLength: 7,
  })
  @IsString()
  @Length(7, 7)
  hexCode: string;
}
