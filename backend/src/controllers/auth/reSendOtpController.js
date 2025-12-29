const User = require("../../models/userModel");
const sendEmail = require("../../utils/sendEmail");
const genOTP = require("../../utils/otpGenerator");

const reSendOTP = async (req,res) => {
    const {email} = req.body;

    try{
        const lowerEmail = email.toLowerCase().trim();
        const user = await User.findOne({email: lowerEmail});

        if(!user) {
            return res.status(400).json({message: "User not found"});
        }

        const {otp, otpExpires} = genOTP();

        await User.updateOne(
            {_id: user._id},
            {$set: {otp:otp, otp:otpExpires}}
        );

        await sendEmail(user.email, otp);

        res.status(200).json({
            message: "New OTP sent to your email.(otp expire in 1 min)",
            email: user.email
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({message:"Server error"});
    }
};

module.exports = {reSendOTP};


