const genOTP = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    const otpExpires = Date.now() + 5 * 60 * 1000; // 15 minutes expiry

    return {otp, otpExpires};
};

module.exports = genOTP;