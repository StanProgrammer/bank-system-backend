const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  payment_date: {
    type: Date,
    default: Date.now
  },
  payment_amount: {
    type: Number,
    required: true
  }
});

const LoanSchema = new mongoose.Schema({
  customer_id: {
    type: String,
    required: true
  },
  loan_name: {
    type: String,
    required: true
  },
  loan_amount: {
    type: Number,
    required: true
  },
  loan_period: {
    type: Number,
    required: true
  },
  rate_of_interest: {
    type: Number,
    required: true
  },
  total_interest: {
    type: Number,
    required: true
  },
  total_amount: {
    type: Number,
    required: true
  },
  monthly_emi: {
    type: Number,
    required: true
  },
  last_emi: {
    type: Number,
    required: true
  },
  payments: [PaymentSchema],
  balance_amount: {
    type: Number,
    required: true
  },
  emi_left: {
    type: Number,
    required: true
  }
});

const Loan = mongoose.model('Loan', LoanSchema);

module.exports = Loan;
