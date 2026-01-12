const jwt = require("jsonwebtoken");

// 1. Check if the Authorization header exists
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer")) {
        return res.status(401).json({ message: "Access Denied. Please Login first." });
    }

    // Extract the token (Remove "Bearer " from the string)
    const token = authHeader.split(" ")[1];

    try {
        // Verify the token using your secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // ATTACH USER INFO TO REQUEST
         req.user = decoded; 

        // Allow them to proceed to the controller
        next();

    } catch (err) {
        console.error("Token verification failed:", err.message);
        return res.status(403).json({ message: "login to access this page." });
    }
};

module.exports = requireAuth;