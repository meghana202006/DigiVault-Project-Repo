const User = require('../../models/userModel');
const {provisionUserSpace} = require('../files/provisionUserSpace');

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
const {encryptPasskey} = require('../../utils/crypto');
const crypto = require('crypto');

// register controller
const register = async (req,res)=>{
    const {username, email, password, security} = req.body;
    
    try{
        // Safely destructure security object
        const salt = security?.salt;
        const recoveryVault = security?.recoveryVault;
        const vaultIv = security?.vaultIv;
        
        // input type check
        if (
            !username || !email || !password || !salt || !recoveryVault || !vaultIv
        ) {
            return res.status(400).json({
                message: "All fields required",
                missing: {
                    username: !username,
                    email: !email,
                    password: !password,
                    salt: !salt,
                    recoveryVault: !recoveryVault,
                    vaultIv: !vaultIv
                }
            });
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
        
        // passkey generater
        // const rawPasskey = crypto.randomBytes(16).toString('hex');
        // const protectedPasskey = encryptPasskey(rawPasskey);
        
        // if user ont exist
        const user = await User.create({
            username: normalizedUsername,
            email: lowerEmail,
            password,
            security:{
                salt, 
                recoveryVault, 
                vaultIv
            }
        });

        // Return success response immediately
        res.status(201).json({

            message: "Registration Successful!",
            user: {
                _id: user._id,
                username: user.username,
                email: user.email
            }
        });
        console.log("Registration Successful!");

        // Create MEGA folders in background (after response is sent)
        provisionUserSpace()
            .then((folderInfo) => {
                console.log("Folder info received:", folderInfo);
                user.megaStorage.uuid = folderInfo.uuid;
                user.megaStorage.rootNodeId = folderInfo.rootNodeId;
                user.megaStorage.sectionNodeIds = new Map(Object.entries(folderInfo.sectionNodeIds));
                
                return user.save();
            })
            .then(() => {
                console.log("Space provisioned successfully to user:", user.username);
            })
            .catch((folderError) => {
                console.error("Space provisioning failed for user:", user.username);
                console.error("Error details:", folderError);
            });
      
    } catch (err){
        console.log("Register Error:", err);
        res.status(500).json({
            message: "Registration failed",
            error: err.message || "Invalid input"
        });
    }
};

module.exports = {register, checkUsername, checkEmail};
