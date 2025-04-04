const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// MongoDB connection
const mongoURI = 'mongodb://127.0.0.1:27017/experiment-management';

// Connect to MongoDB
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Get your User model structure from your actual application
// This is a generic structure - adjust according to your actual model
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', UserSchema);

// Function to create admin user with your specified credentials
const createAdmin = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ name: 'marind' });
    
    if (adminExists) {
      console.log('Admin user "md" already exists');
      return mongoose.disconnect();
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('12345678', salt);
    
    // Create admin user with your specified credentials
    const admin = new User({
      name: 'marind',
      email: 'md@example.com', // You can change this email if needed
      password: hashedPassword,
      role: 'admin'
    });
    
    await admin.save();
    console.log('Admin user "md" created successfully');
    
    // Disconnect from MongoDB
    return mongoose.disconnect();
  } catch (error) {
    console.error('Error creating admin user:', error);
    return mongoose.disconnect();
  }
};

// Run the function
createAdmin();