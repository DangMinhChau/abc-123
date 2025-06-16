import { ApiProperty } from '@nestjs/swagger';

export class BaseResponseDto<T = any> {
  @ApiProperty({
    description: 'Response message',
    example: 'Success',
  })
  message: string;

  @ApiProperty({
    description: 'Response data',
  })
  data: T;
  @ApiProperty({
    description: 'Response metadata',
    example: {
      timestamp: '2024-01-01T00:00:00.000Z',
    },
  })
  meta: {
    timestamp: string;
    [key: string]: any; // Allow additional meta fields
  };
}
