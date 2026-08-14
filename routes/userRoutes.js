const express = require('express');
const { register, login, contact, customer } = require('../controllers/userController');
const validateToken = require('../middleware/auth');
const uploadImage = require('../middleware/uploadImage');
const { validate, registerRules, loginRules, contactRules } = require('../middleware/validators');
const rateLimit = require('../middleware/rateLimit');

const router = express.Router();

router.post('/register', validate(registerRules), register);
router.post('/login', rateLimit({ limit: 20, windowMs: 15 * 60 * 1000 }), validate(loginRules), login);
router.post('/contact-us', validateToken, validate(contactRules), contact);
router.get('/user-data', validateToken, customer);
router.post('/upload-image', validateToken, uploadImage);

module.exports = router;
