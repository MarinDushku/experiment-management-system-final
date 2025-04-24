const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path');
require('dotenv').config(); // For loading environment variables

// Connect to database
connectDB();

const app = express();

// Init Middleware
app.use(express.json());
app.use(cors());

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users')); 
app.use('/api/steps', require('./routes/steps'));
app.use('/api/trials', require('./routes/trials'));
app.use('/api/experiments', require('./routes/experiments'));
app.use('/api/responses', require('./routes/responses'));
app.use('/api/openbci', require('./routes/openBCI'));
// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Add a simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong' });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend', 'build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

// When MongoDB is connected, rebuild indexes (temporary fix)
const mongoose = require('mongoose');

mongoose.connection.once('open', async () => {
  console.log('MongoDB connected, checking indexes...');
  try {
    // Drop existing indexes on the users collection
    await mongoose.connection.db.collection('users').dropIndexes();
    console.log('Dropped existing indexes on users collection');
    
    // Recreate indexes based on the schema
    const User = require('./models/User');
    await User.createIndexes();
    console.log('Recreated indexes on users collection');
  } catch (err) {
    console.error('Error managing indexes:', err);
  }
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});
// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Unexpected server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});