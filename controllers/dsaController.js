const Loan = require('../models/Loan');
const Customer = require('../models/Customer');
const { computeEMI } = require('../utils/loanCalculator');
const { minimumLoss, Trie, topK, UnionFind } = require('../utils/dsa');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

/** Owner check helper shared by DSA endpoints. */
async function ownedLoan(req, loanId) {
  const loan = await Loan.findById(loanId);
  if (!loan) throw new AppError('Loan not found', 404);

  const customer = await Customer.findById(req.user.user.id);
  if (!customer || !customer.loans.some((id) => id.toString() === loanId.toString())) {
    throw new AppError('Unauthorized', 403);
  }
  return loan;
}

/**
 * GET /api/loan/:loanId/insight
 * Runs the O(n log n) minimum-loss algorithm over the loan's payment series:
 * "which pair of payments would have minimized your loss" — a DSA demo on real data.
 */
exports.loanInsight = asyncHandler(async (req, res) => {
  const loan = await ownedLoan(req, req.params.loanId);

  const amounts = (loan.payments || []).map((p) => p.payment_amount);
  const result = minimumLoss(amounts);

  if (!result) {
    return res.json({
      success: true,
      loan_name: loan.loan_name,
      analysis: 'Not enough payment history to analyze (need at least 2 payments).',
    });
  }

  res.json({
    success: true,
    loan_name: loan.loan_name,
    algorithm: 'minimum-loss (O(n log n))',
    min_loss: result.minLoss,
    buy_index: result.buyIndex,
    sell_index: result.sellIndex,
    buy_amount: amounts[result.buyIndex],
    sell_amount: amounts[result.sellIndex],
    recommendation: `Minimize loss by treating payment #${result.buyIndex + 1} as your high point and payment #${result.sellIndex + 1} as your low point — the smallest loss between two payments is ${result.minLoss}.`,
  });
});

/**
 * POST /api/loan/plan  body: { loan_amount, rate_of_interest, target_emi, loan_period? }
 * Binary search (O(log n)) on the monotonic EMI formula:
 *  - max loan period (months) such that EMI <= target
 *  - if loan_period is given, max interest rate such that EMI <= target
 */
exports.loanPlan = asyncHandler(async (req, res) => {
  const { loan_amount, rate_of_interest, target_emi, loan_period } = req.body;
  const amount = Number(loan_amount);
  const rate = Number(rate_of_interest);
  const target = Number(target_emi);

  // --- 1. Max period for the given rate (EMI decreases as months increase) ---
  let lo = 1;
  let hi = 720; // 60 years
  let maxMonths = 0;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (computeEMI(amount, rate, mid).emi <= target) {
      maxMonths = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  if (maxMonths === 0) {
    throw new AppError('No feasible loan period: EMI stays above the target for every tenure. Lower the target or raise the rate.', 400);
  }

  const emiAtMaxPeriod = computeEMI(amount, rate, maxMonths).emi;

  // --- 2. Max interest rate for the given period (EMI increases as rate rises) ---
  let maxRatePct = null;
  let emiAtMaxRate = null;
  if (loan_period) {
    const months = Number(loan_period) * 12;
    if (!Number.isFinite(months) || months <= 0) throw new AppError('Invalid loan_period', 400);

    let rlo = 0.01;
    let rhi = 30;
    const EPS = 0.01;
    while (rhi - rlo > EPS) {
      const mid = (rlo + rhi) / 2;
      if (computeEMI(amount, mid, months).emi <= target) {
        maxRatePct = mid;
        rlo = mid;
      } else {
        rhi = mid;
      }
    }
    if (maxRatePct !== null) {
      emiAtMaxRate = computeEMI(amount, maxRatePct, months).emi;
    }
  }

  res.json({
    success: true,
    algorithm: 'binary-search (O(log n))',
    loan_amount: amount,
    target_emi: target,
    max_period_months: maxMonths,
    max_period_years: +(maxMonths / 12).toFixed(1),
    emi_at_max_period: emiAtMaxPeriod,
    ...(maxRatePct !== null
      ? { max_rate_pct: +maxRatePct.toFixed(2), emi_at_max_rate: emiAtMaxRate }
      : { max_rate_pct: null, note: 'No feasible rate for this period at the target EMI.' }),
  });
});

/**
 * GET /api/admin/duplicates
 * Union-Find (disjoint set) over customers sharing a phone number or email —
 * flags duplicate / multi-account clusters.
 */
exports.duplicateCustomers = asyncHandler(async (req, res) => {
  const customers = await Customer.find({}, 'name email phone');
  const n = customers.length;
  const uf = new UnionFind(n);

  const phoneOwner = new Map();
  const emailOwner = new Map();
  const sharedVia = new Set();

  for (let i = 0; i < n; i++) {
    const c = customers[i];
    if (c.phone) {
      if (phoneOwner.has(c.phone)) {
        uf.union(phoneOwner.get(c.phone), i);
        sharedVia.add('phone');
      } else {
        phoneOwner.set(c.phone, i);
      }
    }
    const emailKey = String(c.email).trim().toLowerCase();
    if (emailOwner.has(emailKey)) {
      uf.union(emailOwner.get(emailKey), i);
      sharedVia.add('email');
    } else {
      emailOwner.set(emailKey, i);
    }
  }

  const clusters = uf.clusters(2).map((members) => ({
    via: [...sharedVia].join(', '),
    size: members.length,
    customers: members.map((i) => ({
      _id: customers[i]._id,
      name: customers[i].name,
      email: customers[i].email,
      phone: customers[i].phone,
    })),
  }));

  res.json({
    success: true,
    algorithm: 'union-find (O(n α(n)))',
    scanned: n,
    clusters,
  });
});

/**
 * GET /api/admin/search?q=prefix
 * Trie prefix search over loan names.
 */
exports.searchLoans = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  if (!q) return res.json({ success: true, matches: [] });

  const loans = await Loan.find({}, 'loan_name loan_amount balance_amount emi_left');
  const trie = new Trie();
  loans.forEach((l) => trie.insert(l.loan_name));

  const names = trie.search(q);
  const byName = new Map(loans.map((l) => [l.loan_name.toLowerCase(), l]));
  const matches = names.map((name) => {
    const loan = byName.get(name);
    return {
      loan_name: loan.loan_name,
      loan_amount: loan.loan_amount,
      balance_amount: loan.balance_amount,
      emi_left: loan.emi_left,
    };
  });

  res.json({
    success: true,
    algorithm: 'trie prefix search',
    query: q,
    matches,
  });
});

/**
 * GET /api/admin/top-loans?k=10
 * Top-K outstanding balances via a size-K min-heap: O(n log k).
 */
exports.topLoans = asyncHandler(async (req, res) => {
  const k = Math.min(Math.max(parseInt(req.query.k, 10) || 10, 1), 100);

  const loans = await Loan.find({}, 'loan_name loan_amount balance_amount emi_left');
  const top = topK(loans, k, (l) => l.balance_amount);

  res.json({
    success: true,
    algorithm: 'min-heap top-K (O(n log k))',
    k,
    loans: top.map((l) => ({
      loan_name: l.loan_name,
      loan_amount: l.loan_amount,
      balance_amount: l.balance_amount,
      emi_left: l.emi_left,
    })),
  });
});
