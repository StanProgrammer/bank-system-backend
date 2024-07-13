const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  loan_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan',
    required: true
  },
  payment_date: {
    type: Date,
    default: Date.now
  },
  payment_amount: {
    type: Number,
    required: true
  }
});

const Transaction = mongoose.model('Transaction', TransactionSchema);

module.exports = Transaction;
