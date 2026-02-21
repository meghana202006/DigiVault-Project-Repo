const File = require('../../models/file');
const User = require('../../models/userModel');
const { getStorage } = require('../../config/mega');
const { cacheMethods } = require('../../utils/redisCache');
const redisService = require('../../utils/redisService');
const { File: MegaFile } = require('megajs');

const deleteFile = async (req,res) => {
    try {
        const fileId = req.params.id;
        
        // Get user from JWT token (email is in 'sub' field)
        const userEmail = req.user.sub;
        if(!userEmail){
            return res.status(401).json({message:"Invalid token - user email not found"});
        }

        // Fetch user from database to get MongoDB ObjectId (ensures consistency)
        const user = await User.findOne({ email: userEmail.toLowerCase().trim() }).select('_id');
        if(!user){
            return res.status(401).json({message:"User not found"});
        }
        
        const userId = user._id;
        if(!userId){
            return res.status(500).json({message:"User ID not found in database"});
        }

        // Find the file in mongo (verify it belongs to this user)
        const file = await File.findOne({_id: fileId, user: userId});
        if(!file){
            return res.status(404).json({message:"File not found"});
        }

        // File URL is stored as plain text (not encrypted), use it directly
        if(!file.url){
            return res.status(400).json({message:"File URL not found"});
        }

        // Use MEGA.js File.fromURL() to get the file object directly from the URL
        // This is the correct way to get a MEGA file object that has the .delete() method
        const megaLink = file.url;
        let megaFile;

        try {
            // Create MEGA file object from URL (same approach as streamController.js)
            megaFile = MegaFile.fromURL(megaLink);
            console.log("This is the megaFile: ", megaFile.toJSON());
            
            // Load file attributes to ensure the link is valid and file exists
            await megaFile.loadAttributes();
            
            // Delete the file from MEGA storage
            await new Promise((resolve, reject) => {
                megaFile.delete((err) => {
                    if(err) {
                        console.error(`Error deleting file "${file.originalName}" from MEGA:`, err);
                        reject(err);
                    } else {
                        console.log(`✅ File "${file.originalName}" deleted successfully from MEGA`);
                        resolve();
                    }
                });
            });
        } catch (megaError) {
            // If file doesn't exist on MEGA or link is invalid, log warning but continue with DB deletion
            console.warn(`⚠️ File "${file.originalName}" not found on MEGA or link invalid. Error:`, megaError.message);
            console.warn('Proceeding with database deletion only. File may have been deleted manually from MEGA.');
        }

        // Capture file info before deletion for recent files removal
        const deletedFileType = file.fileType;
        const deletedFileId = file._id.toString();
        
        await File.deleteOne({_id:fileId});
        
        // ========== INVALIDATE REDIS CACHE ==========
        // Invalidate user's file cache after successful deletion so list reflects update
        const userIdString = userId.toString();
        const invalidateCache = async () => {
            try {
                await cacheMethods.del(userIdString);
                await cacheMethods.del(userIdString + ':recent10');
                console.log(`[Cache] Invalidated file + recent10 cache for user after deletion: ${userIdString}`);
            } catch (e) {
                console.error('[Cache] Error invalidating cache after deletion:', e);
                try {
                    await cacheMethods.del(userIdString);
                    await cacheMethods.del(userIdString + ':recent10');
                } catch (_) {}
            }
        };
        await invalidateCache();

        // Remove from recent files sorted sets (global, section, user)
        try {
            await redisService.removeFile(deletedFileId, deletedFileType, userIdString);
        } catch (recentErr) {
            console.error('[RecentFiles] Error removing file from recent lists:', recentErr);
        }
        
        res.status(200).json({message:"file deleted successfully"});

    } catch (err) {
        console.error("delete error: ", err);
        console.error("Error details:", {
            message: err.message,
            stack: err.stack,
            fileId: req.params.id
        });
        res.status(500).json({
            message: "Delete Failed",
            error: err.message || "Internal server error"
        });
    }
};

module.exports = { deleteFile };