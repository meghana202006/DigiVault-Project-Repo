const User = require("../../models/userModel");
const sendEmail = require("../../utils/sendEmail");
const generateOTP = require("../../utils/otpGenerator");
const { decryptPasskey } = require('../../utils/crypto');

const forgotPassword = async (req,res) => {
    const {email, passkey} = req.body;
    try{
        if(!email || !passkey){
            return res.status(400).json({message:"Email and passkey required."});
        }

        const lowerEmail = email.toLowerCase().trim();
        const user = await User.findOne({email:lowerEmail});
        
        if(!user){
            return res.status(400).json({message:"Invalid Credentials"});
        }

        // Decrypt the user passkey
        const dePasskey = decryptPasskey(user.passkey);

        if(passkey !== dePasskey){
            console.log(`Failed password reset attempt for ${email}: wrong passkey`);
            return res.status(401).json({message:"Invalid passkey. Access Denied."})
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