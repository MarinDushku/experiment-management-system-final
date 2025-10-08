const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

connectDB().then(async () => {
  const users = await User.find({}).select('username role');
  console.log('All users:');
  users.forEach(u => console.log(`  - ${u.username}: ${u.role}`));
  mongoose.disconnect();
});
