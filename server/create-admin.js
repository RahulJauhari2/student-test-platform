const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();

const createAdmin = async () => {
  try {
    await connectDB();
    const email = process.argv[2];
    const password = process.argv[3];

    if (!email || !password) {
      console.log('\n❌ Usage: node create-admin.js <email> <password>\n');
      console.log('Example: node create-admin.js myadmin@school.edu mysecretpassword');
      process.exit(1);
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      existingUser.role = 'admin';
      await existingUser.save();
      console.log(`\n✅ Success: Promoted existing user ${email} to admin!\n`);
    } else {
      await User.create({
        name: 'System Admin',
        email,
        password,
        role: 'admin',
        collegeName: 'Platform Administration',
        isVerified: true,
      });
      console.log(`\n✅ Success: Created a brand new admin account for ${email}!\n`);
    }

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error:', err.message, '\n');
    process.exit(1);
  }
};

createAdmin();
