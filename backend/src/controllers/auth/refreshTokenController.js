const jwtService = require('../../utils/jwtService');
const User = require('../../models/userModel');

// Refresh access token using refresh token
const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ 
                message: 'Refresh token not found',
                requiresOTP: true 
            });
        }

        // Verify refresh token
        const decoded = jwtService.verifyToken(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        if (!decoded) {
            // Refresh token is invalid or expired
            res.clearCookie('refreshToken', {
                httpOnly: true,
                sameSite: 'Strict',
                path: '/'
            });
            return res.status(401).json({ 
                message: 'Refresh token expired or invalid',
                requiresOTP: true 
            });
        }

        // Find user
        const user = await User.findOne({ email: decoded.sub }).select('+password');
        
        if (!user) {
            return res.status(404).json({ 
                message: 'User not found',
                requiresOTP: true 
            });
        }

        // Generate new access token
        const pwdStamp = user.password.slice(-10);
        const accessToken = jwtService.generateToken(user.email, pwdStamp);

        // Optionally generate new refresh token (refresh token rotation)
        const newRefreshToken = jwtService.generateRefreshToken(user.email);

        // Set new refresh token cookie
        res.cookie('refreshToken', newRefreshToken.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Days
            path: '/'
        });

        return res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: accessToken,
            message: 'Token refreshed successfully',
            requiresOTP: false
        });

    } catch (err) {
        console.error('Refresh token error:', err);
        res.clearCookie('refreshToken', {
            httpOnly: true,
            sameSite: 'Strict',
            path: '/'
        });
        return res.status(500).json({ 
            message: 'Server error',
            requiresOTP: true 
        });
    }
};

module.exports = { refreshToken };

