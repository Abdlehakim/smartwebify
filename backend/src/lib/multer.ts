// lib/multer.ts  – single instance for all image routes
import multer from "multer";
export const memoryUpload = multer({ storage: multer.memoryStorage() });
