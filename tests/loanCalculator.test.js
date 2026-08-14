const test = require('node:test');
const assert = require('node:assert/strict');
const { computeEMI, monthsToClear } = require('../utils/loanCalculator');

// Independent reference implementation of the EMI formula.
function referenceEMI(principal, annualRatePct, months) {
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / months;
  const f = Math.pow(1 + r, months);
  return (principal * r * f) / (f - 1);
}

test('computeEMI matches an independent formula', () => {
  for (const [p, rate, months] of [
    [1000000, 8.5, 240],
    [500000, 12, 60],
    [250000, 7.2, 36],
    [1000000, 0, 120],
  ]) {
    const { emi, totalAmount, totalInterest } = computeEMI(p, rate, months);
    const expected = Math.round(referenceEMI(p, rate, months));
    assert.equal(emi, expected);
    assert.equal(totalAmount, emi * months);
    assert.equal(totalInterest, totalAmount - p);
  }
});

test('EMI decreases as tenure grows (monotonic)', () => {
  const short = computeEMI(1000000, 8.5, 120).emi;
  const long = computeEMI(1000000, 8.5, 240).emi;
  assert.ok(long < short);
});

test('EMI increases as rate grows (monotonic)', () => {
  const low = computeEMI(1000000, 5, 120).emi;
  const high = computeEMI(1000000, 15, 120).emi;
  assert.ok(high > low);
});

test('rejects non-positive input', () => {
  assert.throws(() => computeEMI(0, 8.5, 12), RangeError);
  assert.throws(() => computeEMI(1000, 8.5, 0), RangeError);
});

test('monthsToClear computes emi_left and last_emi', () => {
  // 10,000 balance at 2,000 EMI -> 5 EMIs, last is full
  assert.deepEqual(monthsToClear(10000, 2000), { emiLeft: 5, lastEmi: 2000 });
  // 10,500 at 2,000 -> 5 full + 500 remainder -> 6 EMIs, last 500
  assert.deepEqual(monthsToClear(10500, 2000), { emiLeft: 6, lastEmi: 500 });
  assert.deepEqual(monthsToClear(0, 2000), { emiLeft: 0, lastEmi: 0 });
});
