const jwt = require("jsonwebtoken")
const crypto = require("crypto")

const jwtService = {
    generateToken:(userId , pwd , userDBId)=>{
        return jwt.sign(
            {sub: userId, pwd, id: userDBId},
            process.env.JWT_SECRET,
            {expiresIn:'15m'}
        )
    },
    generateRefreshToken:(userId)=>{
        const jti = crypto.randomUUID()
        const token = jwt.sign(
            {sub: userId , jti : jti},
            process.env.REFRESH_TOKEN_SECRET,
            {expiresIn:'7d'}
        )
        return {token , jti}
    },
    verifyToken:(token , secret)=>{
        try{
            return jwt.verify(token , secret)
        }catch(err)
        {
            return null;
        }

    }
}

module.exports = jwtService;