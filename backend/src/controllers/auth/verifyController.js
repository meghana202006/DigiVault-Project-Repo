const User = require('../../models/userModel');
const jwt = require('jsonwebtoken');

// genrater token
const generateToken = (id)=>{
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn:'24h',
    });
};

// OTP veriy
const verifyOTP = async (req,res) => {
    const {email, otp} = req.body;
    console.log(email)
    try{
        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json({message: "User not found"});
        } 
        
        // otp check
        if (user.otp === otp && user.otpExpires > Date.now()){
            // clearing otp
            user.otp = undefined;
            user.otpExpires = undefined;
            await user.save();
            // send token
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id),
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
