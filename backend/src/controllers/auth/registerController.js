const User = require('../../models/userModel');
const {encryptPasskey} = require('../../utils/crypto');
const crypto = require('crypto');

// register controller
const register = async (req,res)=>{
    const {username, email, password} = req.body;
    
    try{
        // input type check
        if (
            !username || !email || !password
        ) {
            return res.status(400).json({message: "All field required"});
        }
        // no duplicate
        const lowerEmail = email.toLowerCase().trim();

        // if user already exists
        const userEx = await User.findOne({email: lowerEmail});
        if(userEx){
            return res.status(400).json({message: 'User already exists'});
        }
        
        // passkey generater
        const rawPasskey = crypto.randomBytes(16).toString('hex');
        const protectedPasskey = encryptPasskey(rawPasskey);
        
        // if user ont exist
        const user = await User.create({
            username,
            email: lowerEmail,
            password,
            passkey: protectedPasskey
        });
        
        if(user) {
            return res.status(201).json({
                message: "Registration Successful! Save the Passkey.",
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    SecretPasskey: rawPasskey
                }
            });
        }
    } catch (err){
        console.log("Register Error")
        res.status(500).json({message: "invalid input"});
    }
};

module.exports = {register};
