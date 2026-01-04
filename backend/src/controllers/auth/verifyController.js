const User = require('../../models/userModel');
const jwt = require('jsonwebtoken');
const jwtService = require('../../utils/jwtService')

// OTP veriy
const verifyOTP = async (req,res) => {
    const {email, otp} = req.body;
    const lowerEmail = email.toLowerCase().trim();

    try{
        const user = await User.findOne({email: lowerEmail}).select('+password');
        console.log(user);
        if(!user){
            return res.status(400).json({message: "User not found"});
        } 
        
        // otp check
        if (user.otp === otp && user.otpExpires > Date.now()){
            // clearing otp
            user.otp = undefined;
            user.otpExpires = undefined;
            await user.save();

            // Token generation
            const pwdStamp = user.password.slice(-10)
            // Normalize email to lowercase for consistency
            const normalizedEmail = user.email.toLowerCase().trim();
            const accessToken = jwtService.generateToken(normalizedEmail, pwdStamp)
            const refreshToken = jwtService.generateRefreshToken(normalizedEmail)
            
            res.cookie('refreshToken', refreshToken.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', // true in production, false in development
                sameSite: 'Strict', // Enhanced security - prevents CSRF attacks
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Days expiration
                path: '/' // Ensure cookie is sent to all routes
            });
            // send token
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                token: accessToken,
                message: "Login Successful!"
            });
        
        } else{
            res.status(400).json({message:"Invalid or expired OTP"});
        }
    } catch(err){
        console.log(err);
        res.status(500).json({message:"Server Error"});
    }
};

module.exports = {verifyOTP};
