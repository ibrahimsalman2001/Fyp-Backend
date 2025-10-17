const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Set a shorter timeout for connection attempts
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      socketTimeoutMS: 45000,
      bufferCommands: false // Disable mongoose buffering
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('⚠️  Running without MongoDB - authentication will use in-memory storage');
    console.log('💡 To fix: Check your MongoDB URI in .env file');
    // Don't exit the process, let the server continue running
  }
};

module.exports = connectDB;