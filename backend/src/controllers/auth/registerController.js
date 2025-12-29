const User = require('../../models/userModel');
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
        // if user ont exist
        const user = await User.create({
            username,
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

module.exports = {register};
