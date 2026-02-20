// lib/uploadToCloudinary.ts  (from the previous message, unchanged)
import { PassThrough } from "stream";
import cloudinary from "./cloudinary";
import type { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";

export async function uploadToCloudinary(
  file: Express.Multer.File,
  folder: string,
): Promise<{ secureUrl: string; publicId: string }> {
  const stream = new PassThrough();
  stream.end(file.buffer);

  return new Promise((resolve, reject) => {
    const cloud = cloudinary.uploader.upload_stream(
      { folder },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error || !result) return reject(error);
        resolve({ secureUrl: result.secure_url, publicId: result.public_id });
      },
    );
    stream.pipe(cloud);
  });
}
