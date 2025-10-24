// Database configuration
export const DATABASE_CONFIG = {
  // MongoDB connection URI
  // For local development: mongodb://localhost:27017/musclerise
  // For MongoDB Atlas: mongodb+srv://<username>:<password>@cluster.mongodb.net/musclerise
  get MONGO_URI() {
    return process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/musclerise';
  },

  // Database name
  get DB_NAME() {
    return process.env.DB_NAME || 'musclerise';
  },

  // Enable MongoDB (set to false to use JSON files only)
  get ENABLE_MONGODB() {
    return process.env.ENABLE_MONGODB === 'true';
  },
};