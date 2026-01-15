const User = require("../../models/userModel");

const resetPassword = async (req, res) => {
    const { email, otp, password } = req.body;
    console.log(otp);

    try {
        const lowerEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: lowerEmail });

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

<<<<<<< HEAD
        // Check if OTP has expired
        if (user.otpExpires < Date.now()) {
=======
        if (Date.now() > user.otpExpires) {
>>>>>>> 8eaa2bc008e7a17aa2d27e091256a1934c9a0750
            return res.status(400).json({ message: "OTP expired" });
        }

        if (user.otp !== otp) {
            console.log(user.otp, otp);
            return res.status(400).json({ message: "Invalid OTP" });
        }

        user.password = password;
        user.otp = undefined;
        user.otpExpires = undefined;

        await user.save();

        res.status(200).json({ message: "Password reset successful" });

    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { resetPassword };
