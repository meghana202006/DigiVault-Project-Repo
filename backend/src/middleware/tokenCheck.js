const jwt = require("jsonwebtoken");

const tokenCheck = (req,res,next) =>{
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith("Bearer")){
        return next();
    } 

    const token = authHeader.split(" ")[1];

    try {
        jwt.verify(token, process.env.JWT_SECRET);

        return res.status(400).json({
            message:" user already logged in"
        });

    } catch (err){
        next();
    }
};

module.exports = tokenCheck;
