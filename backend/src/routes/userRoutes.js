const express = require('express');
const router = express.Router();

const {register} = require('../controllers/auth/registerController');
const {login} = require('../controllers/auth/loginController');
const {verifyOTP} = require('../controllers/auth/verifyController');
const loginLimiter = require("../middleware/loginLimiter"); 
const { reSendOTP } = require('../controllers/auth/reSendOtpController');

// register rout
// you can acess this api by going to "http://localhost:5000/api/users/register"
router.post('/register',register);

// login rout
// you can acess this api by going to "http://localhost:5000/api/users/login"
router.post('/login', login);

// verify rout
// you can acess this api by going to "http://localhost:5000/api/users/verifyOTP"
router.post('/verifyOTP', verifyOTP);

// verify rout
// you can acess this api by going to "http://localhost:5000/api/users/resendOTP"
router.post('/resendOTP', reSendOTP);

module.exports = router;
