const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

connectDB().then(async () => {
  // Update the uppercase MD user
  const user = await User.findOne({ username: { $regex: new RegExp('^MD$', 'i') } });

  if (user && user.username === 'MD') {
    user.role = 'admin';
    await user.save();
    console.log(`Updated ${user.username} to admin role`);
  } else {
    console.log('User MD not found');
  }

  mongoose.disconnect();
});
