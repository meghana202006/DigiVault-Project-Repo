const User = require('../../models/userModel');
const sendEmail = require('../../utils/sendEmail');
const generateOTP = require('../../utils/otpGenerator');
const jwtService = require('../../utils/jwtService');

// login controller
const login = async (req,res)=>{
    const {email, password} = req.body;
    try{
        // type check
        if(
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({message: "Invalid input"});
        }
        // no duplicate
        const lowerEmail = email.toLowerCase().trim();

        // find user
        const user = await User.findOne({email: lowerEmail}).select('+password');

        if(user && (await user.matchPassword(password))){
            // Check if valid refresh token exists
            const refreshToken = req.cookies?.refreshToken;
            
            if (refreshToken) {
                const decoded = jwtService.verifyToken(refreshToken, process.env.REFRESH_TOKEN_SECRET);
                
                // If refresh token is valid and belongs to this user, skip OTP
                // Normalize both emails for comparison (handle case and whitespace)
                const tokenEmail = decoded?.sub?.toLowerCase()?.trim();
                if (decoded && tokenEmail === lowerEmail) {
                    // Generate new access token
                    const pwdStamp = user.password.slice(-10);
                    // Use normalized email for consistency
                    const normalizedEmail = user.email.toLowerCase().trim();
                    const accessToken = jwtService.generateToken(normalizedEmail, pwdStamp);
                    
                    // Optionally refresh the refresh token
                    const newRefreshToken = jwtService.generateRefreshToken(normalizedEmail);
                    
                    res.cookie('refreshToken', newRefreshToken.token, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'Strict',
                        maxAge: 7 * 24 * 60 * 60 * 1000,
                        path: '/'
                    });
                    
                    return res.json({
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        token: accessToken,
                        message: "Login successful",
                        requireOTP: false // Skip OTP step
                    });
                }
            }
            
            // No valid refresh token - require OTP
            const {otp, otpExpires} = generateOTP();

            await User.updateOne(
                {_id:user._id},
                {$set:{otp:otp, otpExpires:otpExpires}}
            );

            // send email
            await sendEmail(user.email, otp);
            res.json({
                message: "OTP sent to your email (Expires in 1 min)",
                email: user.email,
                requireOTP: true // Require OTP step
            });
            
        } else{ 
            res.status(401).json({message: 'Invalid email or password'});
        }
    } catch (err){
        res.status(500).json({message: err.message});
    }
};

module.exports = {login};
