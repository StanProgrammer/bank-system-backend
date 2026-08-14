/**
 * Pure loan-math helpers. Kept free of Express/Mongoose so they are easy to
 * unit test and reuse across controllers and DSA features.
 */

/**
 * Compute the monthly EMI for a loan.
 * Standard formula: EMI = P * r * (1+r)^n / ((1+r)^n - 1)
 *
 * @param {number} loanAmount        Principal (P)
 * @param {number} annualRatePct     Annual interest rate in percent (e.g. 8.5)
 * @param {number} months            Loan tenure in months (n)
 * @returns {{monthlyRate: number, emi: number, totalAmount: number, totalInterest: number}}
 */
function computeEMI(loanAmount, annualRatePct, months) {
  if (loanAmount <= 0 || months <= 0) {
    throw new RangeError('loanAmount and months must be positive');
  }

  const monthlyRate = annualRatePct / 100 / 12;

  let emi;
  if (monthlyRate === 0) {
    // Zero-interest edge case: EMI is just principal split evenly.
    emi = loanAmount / months;
  } else {
    const factor = Math.pow(1 + monthlyRate, months);
    emi = (loanAmount * monthlyRate * factor) / (factor - 1);
  }

  emi = Math.round(emi);
  const totalAmount = emi * months;
  return {
    monthlyRate,
    emi,
    totalAmount,
    totalInterest: totalAmount - loanAmount,
  };
}

/**
 * Number of months required to clear `balance` paying `emi` each month.
 * Pure arithmetic used by the pay-lump-sum flow to recompute emi_left/last_emi.
 *
 * @param {number} balance
 * @param {number} emi
 * @returns {{emiLeft: number, lastEmi: number}}
 */
function monthsToClear(balance, emi) {
  if (balance <= 0) return { emiLeft: 0, lastEmi: 0 };
  if (emi <= 0) throw new RangeError('emi must be positive');

  const fullEmis = Math.floor(balance / emi);
  const remainder = balance % emi;
  return {
    emiLeft: fullEmis + (remainder > 0 ? 1 : 0),
    lastEmi: remainder > 0 ? remainder : emi,
  };
}

module.exports = { computeEMI, monthsToClear };
