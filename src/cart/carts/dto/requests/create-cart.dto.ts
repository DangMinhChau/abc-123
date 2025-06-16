import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCartDto {
  @ApiProperty({
    description: 'ID of the user who owns the cart',
    example: 'uuid-user-id',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
