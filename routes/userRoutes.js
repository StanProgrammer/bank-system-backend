const express = require('express')
const { register, login, contact, customer} = require('../controllers/userController')
const validateToken = require('../middleware/auth')
const uploadImage = require('../middleware/uploadImage')

const router = express.Router()

router.post('/register',register)
router.post('/login',login)
router.post('/contact-us',validateToken,contact)
router.get('/user-data',validateToken,customer)
router.post('/upload-image',validateToken, uploadImage);


module.exports = router