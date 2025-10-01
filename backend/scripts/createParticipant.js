const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

// Connect to MongoDB
connectDB();

const createParticipant = async (username, password) => {
  try {
    // Check if user already exists
    const userExists = await User.findOne({ username });
    
    if (userExists) {
      console.log(`User "${username}" already exists`);
      return false;
    }
    
    // Create participant user
    const participantUser = await User.create({
      username: username,
      password: password || 'participant123',
      role: 'user'
    });
    
    if (participantUser) {
      console.log(`Participant user "${username}" created successfully`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error creating participant user:', error);
    return false;
  }
};

const createMultipleParticipants = async (count = 5) => {
  try {
    console.log(`Creating ${count} participant users...`);
    
    for (let i = 1; i <= count; i++) {
      const username = `participant${i}`;
      const password = 'participant123';
      await createParticipant(username, password);
    }
    
    console.log('\n=== Participant Users Created ===');
    console.log('Username: participant1, participant2, ..., participant' + count);
    console.log('Password: participant123');
    console.log('Role: user');
    console.log('\nThese users can now:');
    console.log('- Login to join experiments');
    console.log('- Connect to admin devices via pairing codes');
    console.log('- Participate in EEG experiments');
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error creating multiple participants:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

// Check command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  // Create 5 default participants
  createMultipleParticipants(5);
} else if (args.length === 1) {
  if (isNaN(args[0])) {
    // Single username provided
    createParticipant(args[0]).then(() => mongoose.disconnect());
  } else {
    // Number of participants provided
    createMultipleParticipants(parseInt(args[0]));
  }
} else if (args.length === 2) {
  // Username and password provided
  createParticipant(args[0], args[1]).then(() => mongoose.disconnect());
} else {
  console.log('Usage:');
  console.log('  node createParticipant.js                    # Create 5 default participants');
  console.log('  node createParticipant.js 10                # Create 10 participants');
  console.log('  node createParticipant.js john               # Create user "john"');
  console.log('  node createParticipant.js john mypassword    # Create user "john" with custom password');
  mongoose.disconnect();
}