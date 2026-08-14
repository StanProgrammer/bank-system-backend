const Customer = require('../models/Customer');
const Contact = require('../models/Contact');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

const signToken = (customer) =>
  new Promise((resolve, reject) => {
    const payload = { user: { id: customer._id, isAdmin: customer.isAdmin } };
    jwt.sign(payload, process.env.JWT_SECRET, (err, token) => (err ? reject(err) : resolve(token)));
  });

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const existing = await Customer.findOne({ email });
  if (existing) throw new AppError('Customer already exists', 409);

  const customer = new Customer({ name, email, password, phone });
  customer.password = await bcrypt.hash(password, await bcrypt.genSalt(10));
  customer.isActive = new Date();
  await customer.save();

  const token = await signToken(customer);
  res.json({ token });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const customer = await Customer.findOne({ email });
  if (!customer) throw new AppError('Customer does not exist', 404);

  const isMatch = await bcrypt.compare(password, customer.password);
  if (!isMatch) throw new AppError('Invalid password', 400);

  const token = await signToken(customer);
  res.json({ token });
});

exports.customer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.user.user.id);
  if (!customer) throw new AppError('Customer does not exist', 404);
  res.json(customer);
});

exports.contact = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;

  const customer = await Customer.findOne({ email });
  if (!customer) throw new AppError('Customer does not exist', 409);

  const contactUs = new Contact({ name, email, subject, message, cId: req.user.user.id });
  await contactUs.save();

  res.status(200).json({
    success: true,
    message: 'Alright, we will get back to you as soon as possible',
  });
});
