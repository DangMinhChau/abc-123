import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class UpdateImageOrderDto {
  @ApiProperty({
    description: 'New display order for the image',
    example: 1,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  displayOrder: number;
}
