const File = require('../../models/file');
const User = require('../../models/userModel');
const {cacheMethods} = require('../../utils/redisCache');

// send list of the data user has
const getAllFiles = async(req, res) => {
    try {
        // Get user email from JWT token (uses 'sub' field)
        const userEmail = req.user.sub;
        if(!userEmail){
            return res.status(401).json({message:"Invalid token - user email not found"});
        }

        // Get user from database to verify MEGA storage setup
        const user = await User.findOne({ email: userEmail.toLowerCase().trim() }).select('_id megaStorage');
        if(!user){
            return res.status(401).json({message:"User not found"});
        }

        // Verify user has MEGA Storage setup (ensures files are in user's folder structure)
        if(!user.megaStorage || !user.megaStorage.rootNodeId){
            return res.status(400).json({
                message:"User does not have a MEGA Storage setup. Files cannot be retrieved."
            });
        }

        const userId = user._id;
        const userIdString = userId.toString(); // Convert to string for cache key

        // ========== CHECK REDIS CACHE FIRST ==========
        const cachedFiles = await cacheMethods.get(userIdString); // Use userIdString, cacheMethods adds prefix

        if(cachedFiles !== null){
            // Cache HIT - return cached data immediately
            console.log(`[Cache HIT] Returning ${cachedFiles.length} cached files for user`);
            return res.status(200).json({
                message:"Files fetched successfully (cached)",
                count: cachedFiles.length,
                files: cachedFiles
            });
        }
      
        // ========== CACHE MISS - FETCH FROM DATABASE ==========
        console.log(`[Cache MISS] Fetching from database for user...`);
        
        // Find all files for this user (files are already nested in user's folder structure)
        // Files are uploaded to: User Root > Section Type > File
        // So filtering by user ID ensures we only get files from user's structure
        const files = await File.find({user: userId})
                                .sort({createdAt: -1})
                                .select('-url -key');

        console.log(`Retrieved ${files.length} files for user (Root: ${user.megaStorage.rootNodeId})`);

        // ========== STORE IN REDIS CACHE ==========
        await cacheMethods.set(userIdString, files); // Full list (newest first)
        const recent10 = files.slice(0, 10);
        await cacheMethods.set(userIdString + ':recent10', recent10); // Keep 10 most recent for quick updates
        console.log(`[Cache] Stored ${files.length} files + recent10 in cache`);

        res.status(200).json({
            message:"Files fetched successfully",
            count: files.length,
            files: files
        })

    }  catch(err){
        console.error("Dashboard error:", err);
        res.status(500).json({
            message:"Failed to load files", 
            error: err.message
        });
    }
};

module.exports = {getAllFiles};