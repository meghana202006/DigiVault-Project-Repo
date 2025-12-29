const genOTP = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    const otpExpires = Date.now() + 1 * 60 * 1000;

    return {otp, otpExpires};
};

module.exports = genOTP;