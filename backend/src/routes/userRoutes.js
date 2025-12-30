const express = require('express');
const router = express.Router();

const {register} = require('../controllers/auth/registerController');
const {login} = require('../controllers/auth/loginController');
const {verifyOTP} = require('../controllers/auth/verifyController');
const {reSendOTP} = require('../controllers/auth/reSendOtpController');
const {forgotPassword} = require('../controllers/auth/forgotPasswordOtp');
const {resetPassword} = require('../controllers/auth/resetPasswordCheck');

const loginLimiter = require("../middleware/loginLimiter"); 
const tokenCheck = require("../middleware/tokenCheck");

// register rout
// you can acess this api by going to "http://localhost:5000/api/users/register"
router.post('/register', register);

// login rout
// you can acess this api by going to "http://localhost:5000/api/users/login"
router.post('/login',loginLimiter, tokenCheck, login);

// verify rout
// you can acess this api by going to "http://localhost:5000/api/users/resendOTP"
router.post('/resendOTP', tokenCheck, reSendOTP);

// verify rout
// you can acess this api by going to "http://localhost:5000/api/users/verifyOTP"
router.post('/verifyOTP', tokenCheck, verifyOTP);

// verify rout
// you can acess this api by going to "http://localhost:5000/api/users/forgotPassword"
router.post('/forgotPassword', forgotPassword);

// verify rout
// you can acess this api by going to "http://localhost:5000/api/users/resetPassword"
router.post('/resetPassword', resetPassword);


module.exports = router;
