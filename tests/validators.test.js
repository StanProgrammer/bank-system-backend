const test = require('node:test');
const assert = require('node:assert/strict');
const {
  registerRules,
  loginRules,
  payEmiRules,
  payLumpRules,
  loanSubmitRules,
  loanPlanRules,
} = require('../middleware/validators');

const runRules = (rules, body) => {
  for (const rule of rules) {
    const err = rule(body);
    if (err) return err;
  }
  return null;
};

test('register rules accept a valid body', () => {
  assert.equal(
    runRules(registerRules, { name: 'A', email: 'a@b.com', password: 'Passw0rd!', phone: '1234567890' }),
    null
  );
});

test('register rules reject bad input', () => {
  assert.ok(runRules(registerRules, { name: '', email: 'a@b.com', password: 'Passw0rd!', phone: '1234567890' }));
  assert.ok(runRules(registerRules, { name: 'A', email: 'nope', password: 'Passw0rd!', phone: '1234567890' }));
  assert.ok(runRules(registerRules, { name: 'A', email: 'a@b.com', password: 'weak', phone: '1234567890' }));
  assert.ok(runRules(registerRules, { name: 'A', email: 'a@b.com', password: 'Passw0rd!', phone: '123' }));
});

test('login rules', () => {
  assert.equal(runRules(loginRules, { email: 'a@b.com', password: 'x' }), null);
  assert.ok(runRules(loginRules, { email: 'a@b.com' }));
  assert.ok(runRules(loginRules, { password: 'x' }));
});

test('payEmi rules reject fractional/zero/negative counts', () => {
  assert.equal(runRules(payEmiRules, { loanId: '507f1f77bcf86cd799439011', numEMIs: 2 }), null);
  assert.ok(runRules(payEmiRules, { loanId: '507f1f77bcf86cd799439011', numEMIs: 0 }));
  assert.ok(runRules(payEmiRules, { loanId: '507f1f77bcf86cd799439011', numEMIs: -3 }));
  assert.ok(runRules(payEmiRules, { loanId: '507f1f77bcf86cd799439011', numEMIs: 2.5 }));
  assert.ok(runRules(payEmiRules, { loanId: 'not-an-id', numEMIs: 2 }));
});

test('payLump rules reject non-positive amounts', () => {
  assert.equal(runRules(payLumpRules, { loanId: '507f1f77bcf86cd799439011', amount: 500 }), null);
  assert.ok(runRules(payLumpRules, { loanId: '507f1f77bcf86cd799439011', amount: 0 }));
  assert.ok(runRules(payLumpRules, { loanId: '507f1f77bcf86cd799439011', amount: -10 }));
  assert.ok(runRules(payLumpRules, { loanId: '507f1f77bcf86cd799439011', amount: 'abc' }));
});

test('loan submit rules', () => {
  assert.equal(runRules(loanSubmitRules, { loan_name: 'L', loan_amount: 100000, loan_period: 5, rate_of_interest: 8 }), null);
  assert.ok(runRules(loanSubmitRules, { loan_name: '', loan_amount: 100000, loan_period: 5, rate_of_interest: 8 }));
  assert.ok(runRules(loanSubmitRules, { loan_name: 'L', loan_amount: -1, loan_period: 5, rate_of_interest: 8 }));
  assert.ok(runRules(loanSubmitRules, { loan_name: 'L', loan_amount: 100000, loan_period: 5, rate_of_interest: 35 }));
});

test('loan plan rules', () => {
  assert.equal(runRules(loanPlanRules, { loan_amount: 100000, rate_of_interest: 8, target_emi: 5000 }), null);
  assert.ok(runRules(loanPlanRules, { loan_amount: 100000, rate_of_interest: 8, target_emi: 0 }));
  assert.ok(runRules(loanPlanRules, { loan_amount: 0, rate_of_interest: 8, target_emi: 5000 }));
});
