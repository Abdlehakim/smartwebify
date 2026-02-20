import { PassThrough } from "stream";
import type { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";
import cloudinary from "./cloudinary";

export async function uploadImagesToCloudinary(
  imageFiles: Express.Multer.File[],
  folder = "Products/images",
): Promise<{ secureUrl: string; publicId: string }[]> {
  return Promise.all(
    imageFiles.map((file, i) => {
      const passthrough = new PassThrough();
      passthrough.end(file.buffer);

      return new Promise<{ secureUrl: string; publicId: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder /*, format: "webp" if you really need it */ },
          (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
            if (error || !result) {
              return reject(
                new Error(`Image ${i + 1} (${file.originalname}) failed: ${error?.message}`),
              );
            }
            resolve({ secureUrl: result.secure_url, publicId: result.public_id });
          },
        );
        passthrough.pipe(stream);
      });
    }),
  );
}
