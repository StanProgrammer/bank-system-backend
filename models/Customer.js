const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
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
  phone: {
    type: String,
    required: true
  },
  loans: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan'
  }],
  isAdmin: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Date,
  },
  profilePic: {
    type: String, 
    default: 'https://via.placeholder.com/150' 
  }
});

const Customer = mongoose.model('Customer', CustomerSchema);

module.exports = Customer;
