const express = require('express');
const router = express.Router();
const { submitLoan,loanData, payLump,payEmi} = require('../controllers/bankController');
const validateToken = require('../middleware/auth');
// Route to calculate loan details
router.post('/submit-loan',validateToken,submitLoan);
router.get('/loan-data',validateToken,loanData);
router.post('/pay-loan',validateToken,payEmi)
router.post('/pay-lumpsum',validateToken,payLump)

module.exports = router;
