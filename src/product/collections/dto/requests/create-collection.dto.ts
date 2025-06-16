import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Length,
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCollectionDto {
  @ApiProperty({
    description: 'Collection name',
    example: 'Summer Vibes 2024',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name: string;

  @ApiProperty({
    description: 'Season of the collection',
    example: 'Summer',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  season: string;

  @ApiProperty({
    description: 'Year of the collection',
    example: 2024,
    minimum: 2000,
    maximum: 2100,
  })
  @Transform(({ value }) => parseInt(value as string))
  @IsNumber()
  @Min(2000)
  @Max(2100)
  year: number;
  @ApiProperty({
    description: 'Collection description',
    example: 'A vibrant collection inspired by summer beaches and sunshine',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Whether the collection is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Images associated with the collection',
    type: 'array',
    items: { type: 'string', format: 'binary' },
    required: false,
  })
  @IsOptional()
  images?: Express.Multer.File[]; // Specify the type of the images array
}
