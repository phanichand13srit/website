const mongoose = require('mongoose');
const dns = require('dns');

// Configure public DNS servers for resolving MongoDB Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI;
  const fallbackUri = 'mongodb://127.0.0.1:27017/arshith_fresh';

  try {
    const targetUri = primaryUri || fallbackUri;
    const conn = await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`✅ MongoDB Connected to: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`⚠️ Primary MongoDB Connection Warning: ${error.message}`);
    if (primaryUri && primaryUri !== fallbackUri) {
      console.log(`🔄 Attempting fallback to local MongoDB (${fallbackUri})...`);
      try {
        const localConn = await mongoose.connect(fallbackUri, {
          serverSelectionTimeoutMS: 3000
        });
        console.log(`✅ Connected to Local MongoDB: ${localConn.connection.host}`);
        return;
      } catch (localErr) {
        console.warn(`⚠️ Local MongoDB fallback unavailable: ${localErr.message}`);
      }
    }
    console.warn(`💡 The server will continue running. Static site and frontend pages remain fully operational.`);
  }
};

module.exports = connectDB;
