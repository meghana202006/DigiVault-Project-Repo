const User = require('../../models/userModel');

// Verify OTP for forgot password flow (doesn't clear OTP, needed for password reset)
const verifyForgotPasswordOTP = async (req, res) => {
    const { email, otp } = req.body;
    const lowerEmail = email.toLowerCase().trim();

    try {
        const user = await User.findOne({ email: lowerEmail });

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // Check if OTP matches and hasn't expired
        if (user.otp === otp && user.otpExpires > Date.now()) {
            // Don't clear OTP here - we need it for password reset
            res.status(200).json({
                message: "OTP verified successfully",
                verified: true
            });
        } else {
            res.status(400).json({ message: "Invalid or expired OTP" });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = { verifyForgotPasswordOTP };


