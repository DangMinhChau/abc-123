import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({
    description: 'Cloudinary URL of uploaded file',
    example:
      'https://res.cloudinary.com/example/image/upload/v1234567890/sample.jpg',
  })
  url: string;

  @ApiProperty({
    description: 'Cloudinary public ID',
    example: 'sample',
  })
  public_id: string;

  @ApiProperty({
    description: 'Secure URL of uploaded file',
    example:
      'https://res.cloudinary.com/example/image/upload/v1234567890/sample.jpg',
  })
  secure_url: string;
}
