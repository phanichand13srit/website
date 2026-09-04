const mongoose = require('mongoose');
const dns = require('dns');

// Configure public DNS servers for resolving MongoDB Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) { }

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI;
  const fallbackUri = 'mongodb://127.0.0.1:27017/arshith_fresh';

  if (primaryUri) {
    try {
      const conn = await mongoose.connect(primaryUri, {
        serverSelectionTimeoutMS: 2500
      });
      console.log(`✅ Connected to Primary MongoDB (Atlas): ${conn.connection.host}`);
      return;
    } catch (error) {
      console.warn(`⚠️ Atlas Connection failed (${error.message.substring(0, 75)}...).`);
    }
  }

  console.log(`🔄 Connecting to Local MongoDB (${fallbackUri})...`);
  try {
    const localConn = await mongoose.connect(fallbackUri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`✅ Connected to Local MongoDB: ${localConn.connection.host}`);
  } catch (localErr) {
    console.error(`❌ Local MongoDB connection error: ${localErr.message}`);
    console.warn(`💡 Please ensure local MongoDB service is started or update your MONGO_URI in .env with a valid MongoDB Atlas connection string and whitelist your IP.`);
  }
};

module.exports = connectDB;
