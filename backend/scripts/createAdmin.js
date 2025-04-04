const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

// Connect to MongoDB
connectDB();

const createAdmin = async () => {
  try {
    // Check if admin exists
    const adminExists = await User.findOne({ username: 'md' });
    
    if (adminExists) {
      console.log('Admin user already exists');
      mongoose.disconnect();
      return;
    }
    
    // Create admin user
    const adminUser = await User.create({
      username: 'md',
      password: '12345678',
      role: 'admin'
    });
    
    if (adminUser) {
      console.log('Admin user created successfully');
    }
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error creating admin user:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

createAdmin();