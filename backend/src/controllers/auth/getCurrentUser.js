const User = require('../../models/userModel');
const jwtService = require('../../utils/jwtService');

const getCurrentUser = async (req,res) => {
    try{
        const authHeader = req.headers.authorization || '';
        console.log(authHeader);
        const token = authHeader.startsWith('Bearer') ? authHeader.split(' ')[1] : null;
        console.log(token);

        if(!token){
            return res.status(401).json({message: 'No token provided'});
        }

        const decoded = jwtService.verifyToken(token, process.env.JWT_SECRET);
        console.log(decoded);
        if(!decoded){
            return res.status(401).json({message: 'Invalid token'});
        }
        // decoded.sub contains the email address, not the user ID
        const normalizedEmail = decoded.sub?.toLowerCase()?.trim();
        const user = await User.findOne({ email: normalizedEmail }).select('username email');
        if(!user){
            return res.status(401).json({message: 'User not found'});
        }
        return res.json({
            name: user.username,
            email: user.email,
        })
    }catch(err){
        console.log(err);
        return res.status(500).json({message: 'Server error'});
    }
}

module.exports = {getCurrentUser};