import { v2 as cloudinary } from "cloudinary";

/**
 * Pull required env-vars and crash immediately if any are missing.
 * (Node will exit with a helpful message instead of silently returning 401s.)
 */
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
  process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  throw new Error(
    "❌ Missing Cloudinary credentials. " +
      "Did you forget to add them to your .env file or deployment secrets?",
  );
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key:    CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

/** Single exported instance for the whole app */
export default cloudinary;
