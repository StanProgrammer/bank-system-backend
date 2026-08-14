const express = require('express');
const router = express.Router();
const validateToken = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const { duplicateCustomers, searchLoans, topLoans } = require('../controllers/dsaController');

// All admin routes require a valid token AND isAdmin flag.
router.use(validateToken, isAdmin);

router.get('/admin/duplicates', duplicateCustomers);
router.get('/admin/search', searchLoans);
router.get('/admin/top-loans', topLoans);

module.exports = router;
