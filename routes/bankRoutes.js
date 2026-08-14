const express = require('express');
const router = express.Router();
const { submitLoan, loanData, payLump, payEmi } = require('../controllers/bankController');
const { loanInsight, loanPlan } = require('../controllers/dsaController');
const validateToken = require('../middleware/auth');
const { validate, loanSubmitRules, payEmiRules, payLumpRules, loanPlanRules } = require('../middleware/validators');

router.post('/submit-loan', validateToken, validate(loanSubmitRules), submitLoan);
router.get('/loan-data', validateToken, loanData);
router.post('/pay-loan', validateToken, validate(payEmiRules), payEmi);
router.post('/pay-lumpsum', validateToken, validate(payLumpRules), payLump);

// DSA-powered endpoints
router.get('/loan/:loanId/insight', validateToken, loanInsight);
router.post('/loan/plan', validateToken, validate(loanPlanRules), loanPlan);

module.exports = router;
