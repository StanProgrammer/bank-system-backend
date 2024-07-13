const Loan = require("../models/Loan");
const Customer = require("../models/Customer");

exports.submitLoan = async (req, res) => {
  const customer_id = req.user.user.id;
  const { loan_name, loan_amount, loan_period, rate_of_interest } = req.body;

  let loan = await Loan.findOne({ loan_name });
  if (loan) {
    return res.status(409).json({ msg: "Loan with this name already exists, please use a different name" });
  }

 
  const monthly_interest_rate = rate_of_interest / 100 / 12;
  let emi =
    (loan_amount * monthly_interest_rate * Math.pow(1 + monthly_interest_rate, loan_period * 12)) /
    (Math.pow(1 + monthly_interest_rate, loan_period * 12) - 1);
  emi = Math.round(emi);

  const emi_left = loan_period * 12;
  let total_amount = emi * emi_left;

  const balance_amount = total_amount;
  const last_emi = emi; // Initially set last_emi same as regular emi
  const total_interest = total_amount - loan_amount
  try {
    loan = new Loan({
      loan_name,
      customer_id,
      loan_amount,
      loan_period,
      rate_of_interest,
      total_amount,
      monthly_emi: emi,
      last_emi,
      balance_amount,
      emi_left,
      total_interest
    });

    await loan.save();

    await Customer.findByIdAndUpdate(customer_id, { $push: { loans: loan._id } });

    res.status(200).json({
      success: true,
      loan: {
        total_amount,
        monthly_emi: emi,
        loan_name,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.loanData = async (req, res) => {
  const id = req.user.user.id;

  try {
    // Find the customer and check if they exist
    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    // Fetch the loan details for each loan ID in customer.loans
    const loans = await Loan.find({ _id: { $in: customer.loans } });

    res.status(200).json({
      success: true,
      loans,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.payEmi = async (req, res) => {
  const { loanId, numEMIs } = req.body;
  const customerId = req.user.user.id;

  try {
    // Find the loan and customer
    const loan = await Loan.findById(loanId);
    const customer = await Customer.findById(customerId);

    if (!loan || !customer) {
      return res.status(404).json({ success: false, message: "Loan or customer not found" });
    }

    // Check if the customer owns this loan
    if (!customer.loans.includes(loanId)) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const emiAmount = loan.monthly_emi;
    let totalPayment = numEMIs * emiAmount;
    if (loan.emi_left === 1) {
      //last emi amount
      totalPayment = loan.last_emi;
    } else if (loan.emi_left === numEMIs) {
      totalPayment = (numEMIs - 1) * emiAmount + loan.last_emi;
    }
    // Check if the payment amount exceeds the balance
    if (totalPayment > loan.balance_amount) {
      return res.status(400).json({ success: false, message: "Payment amount exceeds balance amount" });
    }

    const remainingEmis = loan.emi_left - numEMIs;
    const newBalanceAmount = loan.balance_amount - totalPayment;

    // Update loan details
    loan.emi_left = remainingEmis;
    loan.balance_amount = newBalanceAmount;
    
    // Add payment records
    for (let i = 0; i < numEMIs; i++) {
      loan.payments.push({ payment_amount: emiAmount });
    }

    if (newBalanceAmount === 0) {
      // Remove the loan ID from customer's loans array
      customer.loans = customer.loans.filter((id) => id.toString() !== loanId.toString());

      // Delete the loan from the Loan collection
      await Loan.findByIdAndDelete(loanId);

      // Save customer's updated loans array
      await customer.save();

      res.status(200).json({
        success: true,
        message: `Successfully paid ${numEMIs} EMIs for loan ${loan.loan_name}. Loan fully paid and deleted.`,
        loan: null, // Return null or an empty object since the loan is deleted
      });
    } else {
      await loan.save();
      res.status(200).json({
        success: true,
        message: `Successfully paid ${numEMIs} EMIs for loan ${loan.loan_name}`,
        loan: loan,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.payLump = async (req, res) => {
  const { loanId, amount } = req.body;
  const customerId = req.user.user.id;

  try {
    const loan = await Loan.findById(loanId);
    const customer = await Customer.findById(customerId);

    if (!loan || !customer) {
      return res.status(404).json({ success: false, message: "Loan or customer not found" });
    }

    if (!customer.loans.includes(loanId)) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if (amount > loan.balance_amount) {
      return res.status(400).json({ success: false, message: "Payment amount exceeds balance amount" });
    }

    loan.balance_amount -= amount;
    loan.payments.push({ payment_amount: amount });

    let remainingAmount = loan.balance_amount;
    const regularEMIs = Math.floor(remainingAmount / loan.monthly_emi);
    const lastEMI = remainingAmount % loan.monthly_emi;

    loan.emi_left = regularEMIs + (lastEMI > 0 ? 1 : 0);
    loan.last_emi = lastEMI > 0 ? lastEMI : loan.monthly_emi;

    if (loan.balance_amount === 0) {
      customer.loans = customer.loans.filter((id) => id.toString() !== loanId.toString());
      await Loan.findByIdAndDelete(loanId);
      await customer.save();

      return res.status(200).json({
        success: true,
        message: `Successfully paid off the loan ${loan.loan_name}. Loan fully paid and deleted.`,
        loan: null,
      });
    }

    await loan.save();
    res.status(200).json({
      success: true,
      message: `Successfully paid ${amount} towards loan ${loan.loan_name}.`,
      loan,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
