const mongoose = require('mongoose');
const dns = require('dns');

// Configure public DNS servers for resolving MongoDB Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI;
  const fallbackUri = 'mongodb://127.0.0.1:27017/arshith_fresh';

  if (primaryUri) {
    try {
      const conn = await mongoose.connect(primaryUri, {
        serverSelectionTimeoutMS: 3000
      });
      // Verify read/write capability with an immediate ping
      await conn.connection.db.admin().ping();
      console.log(`✅ MongoDB Atlas Connected to: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.warn(`⚠️ Primary MongoDB Atlas Connection Warning: ${error.message}`);
      try {
        await mongoose.disconnect();
      } catch (discErr) {}
    }
  }

  // Fallback to local MongoDB
  console.log(`🔄 Connecting to Local MongoDB (${fallbackUri})...`);
  try {
    const localConn = await mongoose.connect(fallbackUri, {
      serverSelectionTimeoutMS: 3000
    });
    await localConn.connection.db.admin().ping();
    console.log(`✅ Connected to Local MongoDB: ${localConn.connection.host}`);
  } catch (localErr) {
    console.warn(`⚠️ Local MongoDB connection error: ${localErr.message}`);
    console.warn(`💡 The server will continue running. Static site and frontend pages remain fully operational.`);
  }
};

module.exports = connectDB;

