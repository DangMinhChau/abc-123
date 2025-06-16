import { Injectable, Inject } from '@nestjs/common';
import {
  UploadApiErrorResponse,
  UploadApiResponse,
  v2 as cloudinary,
} from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor(@Inject('CLOUDINARY') private cloudinary) {}

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'product-images',
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: folder,
          transformation: [
            { width: 1000, height: 1000, crop: 'limit' },
            { quality: 'auto:good' },
          ],
        },
        (error: UploadApiErrorResponse, result: UploadApiResponse) => {
          if (error) {
            return reject(new Error(error.message));
          }
          resolve(result);
        },
      );
      const stream = Readable.from(file.buffer);
      stream.pipe(uploadStream);
    });
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: string = 'product-images',
  ): Promise<UploadApiResponse[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, folder));
    return Promise.all(uploadPromises);
  }

  async deleteFile(publicId: string): Promise<any> {
    console.log('Deleting file with publicId:', publicId);
    return cloudinary.uploader.destroy(publicId);
  }

  async deleteMultipleFiles(publicIds: string[]): Promise<any> {
    return cloudinary.api.delete_resources(publicIds);
  }

  async getImageDetails(publicId: string): Promise<any> {
    return cloudinary.api.resource(publicId);
  }

  generateImageUrl(
    publicId: string,
    transformations?: Record<string, any>,
  ): string {
    return cloudinary.url(publicId, transformations);
  }
}

// import { Injectable } from '@nestjs/common';
// import {
//   UploadApiErrorResponse,
//   UploadApiOptions,
//   UploadApiResponse,
//   v2 as cloudinary,
// } from 'cloudinary';
// import { Readable } from 'stream';

// @Injectable()
// export class CloudinaryService {
//   uploadFile(file: Express.Multer.File): Promise<UploadApiResponse> {
//     return new Promise((resolve, reject) => {
//       const uploadStream = cloudinary.uploader.upload_stream(
//         {
//           resource_type: 'auto', // Tự động nhận diện loại tài nguyên (image, video, v.v.)
//           folder: 'product-images', // Thư mục lưu trữ trên Cloudinary
//         },
//         (error: UploadApiErrorResponse, result: UploadApiResponse) => {
//           if (error) {
//             return reject(new Error(error.message)); // reject kiểu UploadApiErrorResponse
//           }
//           resolve(result); // resolve kiểu UploadApiResponse
//         },
//       );
//       const stream = Readable.from(file.buffer);
//       stream.pipe(uploadStream);
//     });
//   }
// }
