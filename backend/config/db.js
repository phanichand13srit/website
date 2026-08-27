const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/arshith_fresh');
    console.log(`✅ MongoDB Connected to Self-Hosted DB: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`⚠️ MongoDB Connection Warning: ${error.message}`);
    console.warn(`💡 The server will continue running. Static site and frontend pages remain fully operational.`);
  }
};

module.exports = connectDB;
