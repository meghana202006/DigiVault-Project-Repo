const User = require("../../models/userModel");
const sendEmail = require("../../utils/sendEmail");
const generateOTP = require("../../utils/otpGenerator");


const forgotPassword = async (req,res) => {
    const {email} = req.body;
    try{
        const lowerEmail = email.toLowerCase().trim();
        const user = await User.findOne({email:lowerEmail});
        
        if(!user){
            return res.status(200).json({message:"If email is register, OTP sent."});
        }

        const {otp, otpExpired} = generateOTP();
        await User.updateOne(
            {_id:user._id},
            {$set: {otp: otp, otpExpired: otpExpired}}
        );

        await sendEmail(user.email, otp);
        res.status(200).json({message:"OTP sent to your email."});
    
    } catch(err){
        console.log(err);
        res.status(500).json({message:"Server error"});
    }
};

module.exports = {forgotPassword};