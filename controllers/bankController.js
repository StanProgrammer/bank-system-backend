const Loan = require('../models/Loan');
const Customer = require('../models/Customer');
const { computeEMI, monthsToClear } = require('../utils/loanCalculator');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

/**
 * Optimistic-concurrency payment helper.
 * Re-reads the loan, computes the update from the snapshot, and applies it with
 * a conditional atomic update. If another request changed the balance in
 * between, the filter fails and we retry with a fresh snapshot.
 *
 * @returns updated loan, or null when `compute` returns null
 */
async function applyLoanUpdate(loanId, compute, attempts = 3) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const loan = await Loan.findById(loanId);
    if (!loan) throw new AppError('Loan not found', 404);

    const plan = compute(loan);
    if (plan === null) return null;

    const updated = await Loan.findOneAndUpdate(
      { _id: loanId, balance_amount: loan.balance_amount, emi_left: loan.emi_left },
      plan.update,
      { new: true }
    );
    if (updated) return updated;
  }
  throw new AppError('Too many concurrent updates on this loan, please try again', 409);
}

/** Remove a fully-paid loan from the customer's list (idempotent). */
async function detachLoan(customerId, loanId) {
  await Customer.findByIdAndUpdate(customerId, { $pull: { loans: loanId } });
}

exports.submitLoan = asyncHandler(async (req, res) => {
  const customer_id = req.user.user.id;
  const { loan_name, loan_amount, loan_period, rate_of_interest } = req.body;

  const existing = await Loan.findOne({ loan_name });
  if (existing) {
    throw new AppError('Loan with this name already exists, please use a different name', 409);
  }

  const months = loan_period * 12;
  const { emi, totalAmount, totalInterest } = computeEMI(loan_amount, rate_of_interest, months);

  const loan = new Loan({
    loan_name,
    customer_id,
    loan_amount,
    loan_period,
    rate_of_interest,
    total_amount: totalAmount,
    monthly_emi: emi,
    last_emi: emi,
    balance_amount: totalAmount,
    emi_left: months,
    total_interest: totalInterest,
  });

  await loan.save();
  await Customer.findByIdAndUpdate(customer_id, { $push: { loans: loan._id } });

  res.status(200).json({
    success: true,
    loan: { total_amount: totalAmount, monthly_emi: emi, loan_name },
  });
});

exports.loanData = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.user.user.id);
  if (!customer) throw new AppError('Customer not found', 404);

  const loans = await Loan.find({ _id: { $in: customer.loans } });
  res.status(200).json({ success: true, loans });
});

exports.payEmi = asyncHandler(async (req, res) => {
  const { loanId, numEMIs } = req.body;
  const customerId = req.user.user.id;

  const customer = await Customer.findById(customerId);
  if (!customer) throw new AppError('Customer not found', 404);
  if (!customer.loans.some((id) => id.toString() === loanId.toString())) {
    throw new AppError('Unauthorized', 403);
  }

  const updated = await applyLoanUpdate(loanId, (loan) => {
    if (numEMIs > loan.emi_left) {
      throw new AppError(`Cannot pay more EMIs than remaining (${loan.emi_left} left)`, 400);
    }

    let totalPayment = numEMIs * loan.monthly_emi;
    if (loan.emi_left === 1) {
      totalPayment = loan.last_emi;
    } else if (loan.emi_left === numEMIs) {
      totalPayment = (numEMIs - 1) * loan.monthly_emi + loan.last_emi;
    }
    if (totalPayment > loan.balance_amount) {
      throw new AppError('Payment amount exceeds balance amount', 400);
    }

    const remainingEmis = loan.emi_left - numEMIs;
    const newBalance = loan.balance_amount - totalPayment;
    const payments = Array.from({ length: numEMIs }, () => ({ payment_amount: loan.monthly_emi }));

    return {
      update: {
        $set: { balance_amount: newBalance, emi_left: remainingEmis },
        $push: { payments: { $each: payments } },
      },
    };
  });

  if (updated.balance_amount === 0) {
    await detachLoan(customerId, loanId);
    await Loan.findByIdAndDelete(loanId);
    return res.status(200).json({
      success: true,
      message: `Successfully paid ${numEMIs} EMIs for loan ${updated.loan_name}. Loan fully paid and deleted.`,
      loan: null,
    });
  }

  res.status(200).json({
    success: true,
    message: `Successfully paid ${numEMIs} EMIs for loan ${updated.loan_name}`,
    loan: updated,
  });
});

exports.payLump = asyncHandler(async (req, res) => {
  const { loanId, amount } = req.body;
  const customerId = req.user.user.id;

  const customer = await Customer.findById(customerId);
  if (!customer) throw new AppError('Customer not found', 404);
  if (!customer.loans.some((id) => id.toString() === loanId.toString())) {
    throw new AppError('Unauthorized', 403);
  }

  const updated = await applyLoanUpdate(loanId, (loan) => {
    if (amount > loan.balance_amount) {
      throw new AppError('Payment amount exceeds balance amount', 400);
    }

    const newBalance = loan.balance_amount - amount;
    const { emiLeft, lastEmi } = monthsToClear(newBalance, loan.monthly_emi);

    return {
      update: {
        $set: { balance_amount: newBalance, emi_left: emiLeft, last_emi: lastEmi },
        $push: { payments: { payment_amount: amount } },
      },
    };
  });

  if (updated.balance_amount === 0) {
    await detachLoan(customerId, loanId);
    await Loan.findByIdAndDelete(loanId);
    return res.status(200).json({
      success: true,
      message: `Successfully paid off the loan ${updated.loan_name}. Loan fully paid and deleted.`,
      loan: null,
    });
  }

  res.status(200).json({
    success: true,
    message: `Successfully paid ${amount} towards loan ${updated.loan_name}.`,
    loan: updated,
  });
});
