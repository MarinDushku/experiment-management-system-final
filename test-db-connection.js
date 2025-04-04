const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Set explicit MongoDB URI using IPv4
const mongoURI = 'mongodb://127.0.0.1:27017/experiment-management';

console.log('Attempting to connect to MongoDB with URI:', mongoURI);

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(mongoURI);

    console.log(`MongoDB Connected Successfully: ${conn.connection.host}`);
    console.log('Connection established to database:', conn.connection.name);
    
    // Close the connection after testing
    await mongoose.connection.close();
    console.log('Connection closed');
    
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
  }
};

// Run the connection test
connectDB();