/**
 * Lightweight, dependency-free request validation.
 * `validate(rules)` runs each rule against req.body and responds 400 with the
 * first error found. Rules are plain functions returning an error string or null.
 */

const { AppError } = require('./errorHandler');
const mongoose = require('mongoose');

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v));
const isPhone = (v) => /^\d{10}$/.test(String(v));
const strongPassword = (v) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(String(v));

const validate = (rules) => (req, res, next) => {
  for (const rule of rules) {
    const error = rule(req.body);
    if (error) return next(new AppError(error, 400));
  }
  next();
};

const registerRules = [
  (b) => (b.name && String(b.name).trim() ? null : 'Name is required'),
  (b) => (isEmail(b.email) ? null : 'Valid email is required'),
  (b) => (strongPassword(b.password) ? null : 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number and 1 special character'),
  (b) => (isPhone(b.phone) ? null : 'Phone must be exactly 10 digits'),
];

const loginRules = [
  (b) => (isEmail(b.email) ? null : 'Valid email is required'),
  (b) => (b.password ? null : 'Password is required'),
];

const loanSubmitRules = [
  (b) => (b.loan_name && String(b.loan_name).trim() ? null : 'Loan name is required'),
  (b) => (Number(b.loan_amount) > 0 ? null : 'Loan amount must be greater than 0'),
  (b) => (Number(b.loan_period) > 0 ? null : 'Loan period must be greater than 0'),
  (b) => {
    const r = Number(b.rate_of_interest);
    return r > 0 && r <= 30 ? null : 'Rate of interest must be between 0 and 30';
  },
];

const payEmiRules = [
  (b) => (mongoose.isValidObjectId(b.loanId) ? null : 'Invalid loan id'),
  (b) => {
    const n = Number(b.numEMIs);
    return Number.isInteger(n) && n >= 1 ? null : 'numEMIs must be a positive whole number';
  },
];

const payLumpRules = [
  (b) => (mongoose.isValidObjectId(b.loanId) ? null : 'Invalid loan id'),
  (b) => {
    const a = Number(b.amount);
    return Number.isFinite(a) && a > 0 ? null : 'Amount must be a positive number';
  },
];

const loanPlanRules = [
  (b) => (Number(b.loan_amount) > 0 ? null : 'Loan amount must be greater than 0'),
  (b) => {
    const r = Number(b.rate_of_interest);
    return r > 0 && r <= 30 ? null : 'Rate of interest must be between 0 and 30';
  },
  (b) => (Number(b.target_emi) > 0 ? null : 'Target EMI must be greater than 0'),
];

const contactRules = [
  (b) => (b.name && String(b.name).trim() ? null : 'Name is required'),
  (b) => (isEmail(b.email) ? null : 'Valid email is required'),
  (b) => (b.subject && String(b.subject).trim() ? null : 'Subject is required'),
  (b) => (b.message && String(b.message).trim() ? null : 'Message is required'),
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  loanSubmitRules,
  payEmiRules,
  payLumpRules,
  loanPlanRules,
  contactRules,
  isEmail,
  isPhone,
  strongPassword,
};
