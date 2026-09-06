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

  let mongoUri = process.env.MONGO_URI.trim();

  try {
    const options = {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
      socketTimeoutMS: 45000,
    };
    if (process.env.NODE_ENV !== 'production') {
      options.family = 4;
    }

    const conn = await mongoose.connect(mongoUri, options);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    
    // Automatically retry with fallback TLS options if TLS/SSL alert 80 occurs in serverless containers
    if (error.message && (error.message.includes('SSL') || error.message.includes('tls') || error.message.includes('alert') || error.message.includes('80'))) {
      try {
        console.log('🔄 Retrying MongoDB connection with serverless TLS fallback...');
        const fallbackOptions = {
          serverSelectionTimeoutMS: 10000,
          tls: true,
          tlsAllowInvalidCertificates: true,
        };
        const conn = await mongoose.connect(mongoUri, fallbackOptions);
        console.log(`✅ MongoDB Connected (TLS Fallback): ${conn.connection.host}`);
        return conn;
      } catch (fallbackErr) {
        console.error(`❌ MongoDB Fallback Connection Error: ${fallbackErr.message}`);
        throw fallbackErr;
      }
    }
    throw error;
  }
};

module.exports = connectDB;
