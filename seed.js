/**
 * Seeds a test user so the app can be logged into immediately.
 *   Email: testuser@bank.com
 *   Password: Test@123
 * Idempotent: does nothing if the user already exists.
 *
 * Usage: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Customer = require('./models/Customer');

(async () => {
  await mongoose.connect(process.env.DB_URL);

  const email = 'testuser@bank.com';
  const existing = await Customer.findOne({ email });
  if (existing) {
    console.log(`Test user already exists (${email}). Nothing to do.`);
    await mongoose.disconnect();
    return;
  }

  const customer = new Customer({
    name: 'Test User',
    email,
    phone: '1234567890',
    isActive: new Date(),
  });
  customer.password = await bcrypt.hash('Test@123', await bcrypt.genSalt(10));
  await customer.save();

  console.log(`Created test user: ${email} / Test@123`);
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
