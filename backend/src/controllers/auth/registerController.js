const User = require('../../models/userModel');

// Check username availability controller
const checkUsername = async (req, res) => {
    const { username } = req.body;
    
    try {
        // Check if username is provided
        if (!username || username.trim() === '') {
            return res.status(400).json({ 
                available: false, 
                message: 'Username is required' 
            });
        }

        // Normalize username (trim and lowercase for consistency)
        const normalizedUsername = username.trim().toLowerCase();
        
        // Check if username exists (case-insensitive)
        const userExists = await User.findOne({ 
            username: { $regex: new RegExp(`^${normalizedUsername}$`, 'i') } 
        });
        
        if (userExists) {
            return res.status(200).json({ 
                available: false, 
                message: 'Username already taken' 
            });
        }
        
        return res.status(200).json({ 
            available: true, 
            message: 'Username is available' 
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ 
            available: false, 
            message: 'Error checking username' 
        });
    }
};

// Check email availability controller
const checkEmail = async (req, res) => {
    const { email } = req.body;
    
    try {
        // Check if email is provided
        if (!email || email.trim() === '') {
            return res.status(400).json({ 
                available: false, 
                message: 'Email is required' 
            });
        }

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return res.status(400).json({ 
                available: false, 
                message: 'Invalid email format' 
            });
        }

        // Normalize email (trim and lowercase for consistency)
        const normalizedEmail = email.trim().toLowerCase();
        
        // Check if email exists
        const userExists = await User.findOne({ email: normalizedEmail });
        
        if (userExists) {
            return res.status(200).json({ 
                available: false, 
                message: 'Email already registered' 
            });
        }
        
        return res.status(200).json({ 
            available: true, 
            message: 'Email is available' 
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ 
            available: false, 
            message: 'Error checking email' 
        });
    }
};

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
        
        // Normalize username
        const normalizedUsername = username.trim().toLowerCase();
        
        // Check if username already exists
        const usernameExists = await User.findOne({ 
            username: { $regex: new RegExp(`^${normalizedUsername}$`, 'i') } 
        });
        if(usernameExists){
            return res.status(400).json({message: 'Username already taken'});
        }
        
        // Check if email already exists
        const lowerEmail = email.toLowerCase().trim();
        const userEx = await User.findOne({email: lowerEmail});
        if(userEx){
            return res.status(400).json({message: 'User already exists'});
        }
        
        // Create user with normalized username
        const user = await User.create({
            username: normalizedUsername,
            email: lowerEmail,
            password
        });
        
        if(user) {
           return res.status(201).json({
            message: "Registration Successful! Please Login to verify your account."
           });
        }
    } catch (err){
        console.log(err)
        res.status(500).json({message: "invalid input"});
    }
};

module.exports = {register, checkUsername, checkEmail};
