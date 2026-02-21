const express = require('express');
const router = express.Router();

const {register, checkUsername, checkEmail} = require('../controllers/auth/registerController');
const {login} = require('../controllers/auth/loginController');
const {verifyOTP} = require('../controllers/auth/verifyController');
const {reSendOTP} = require('../controllers/auth/reSendOtpController');
const {forgotPassword} = require('../controllers/auth/forgotPasswordOtp');
const {verifyForgotPasswordOTP} = require('../controllers/auth/verifyForgotPasswordOtp');
const {resetPassword} = require('../controllers/auth/resetPasswordCheck');
const {refreshToken} = require('../controllers/auth/refreshTokenController');
const {getCurrentUser} = require('../controllers/auth/getCurrentUser');

const loginLimiter = require("../middleware/loginLimiter"); 
const tokenCheck = require("../middleware/tokenCheck");

// Check username availability route
// Access at: "http://localhost:5000/api/users/checkUsername"
router.post('/checkUsername', checkUsername);

// Check email availability route
// Access at: "http://localhost:5000/api/users/checkEmail"
router.post('/checkEmail', checkEmail);

// register rout
// you can acess this api by going to "http://localhost:5000/api/users/register"
router.post('/register', register);

// login route
// you can acess this api by going to "http://localhost:5000/api/users/login"
router.post('/login',login);
// router.post('/login',loginLimiter, tokenCheck, login);
// verify rout
// you can acess this api by going to "http://localhost:5000/api/users/resendOTP"
router.post('/resendOTP', reSendOTP);

// verify route
// you can acess this api by going to "http://localhost:5000/api/users/verifyOTP"
router.post('/verifyOTP', tokenCheck, verifyOTP);

// forgotPassword route
// you can acess this api by going to "http://localhost:5000/api/users/forgotPassword"
router.post('/forgotPassword',tokenCheck, forgotPassword);

// verify OTP for forgot password flow
// you can acess this api by going to "http://localhost:5000/api/users/verifyForgotPasswordOTP"
router.post('/verifyForgotPasswordOTP', verifyForgotPasswordOTP);

// verify rout
// you can acess this api by going to "http://localhost:5000/api/users/resetPassword"
router.post('/resetPassword',tokenCheck, resetPassword);

// refresh token route
// you can access this api by going to "http://localhost:5000/api/users/refreshToken"
router.post('/refreshToken', refreshToken);

// get current user route
// you can access this api by going to "http://localhost:5000/api/users/getCurrentUser"
router.get('/getCurrentUser', getCurrentUser);


module.exports = router;
