const mongoose = require('mongoose');
const dns = require('dns');

// Only set custom DNS in non-production local environments if needed
if (process.env.NODE_ENV !== 'production') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (e) {}
}

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing from environment variables.');
  }
  try {
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of default 30s
    };
    if (process.env.NODE_ENV !== 'production') {
      options.family = 4;
    }
    const conn = await mongoose.connect(process.env.MONGO_URI, options);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
