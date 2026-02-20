if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

console.log('MONGODB_URI:', process.env.MONGODB_URI);  // Debugging line

import mongoose from 'mongoose';
import Product from './models/stock/Product';

const updateProductsWithReviews = async () => {
  try {
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI as string);

    const result = await Product.updateMany({}, { $set: { reviews: [] } });
    console.log(`Updated ${result.modifiedCount} products with the new 'reviews' field.`);
  } catch (error) {
    console.error('Error updating products:', error);
  } finally {
    mongoose.disconnect();
  }
};

updateProductsWithReviews();
