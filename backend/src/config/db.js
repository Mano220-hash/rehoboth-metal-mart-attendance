const mongoose = require('mongoose');
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const connectDB = async (retries = 5) => {
  while (retries > 0) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI, { family: 4 });
      console.log(`\u2705 MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      retries -= 1;
      console.error(`\u274C MongoDB Connection Error: ${error.message}. Retries left: ${retries}`);
      if (retries === 0) process.exit(1);
      await new Promise((res) => setTimeout(res, 2000));
    }
  }
};

module.exports = connectDB;
