// const File = require('../../models/file');
// const User = require('../../models/userModel');
// const { cacheMethods } = require('../../utils/redisCache');
// const redisService = require('../../utils/redisService');
// const { exec } = require('child_process');
// const util = require('util');

// // Promisify exec to use async/await for shell commands
// const execPromise = util.promisify(exec);

// const deleteFile = async (req, res) => {
//     try {
//         const fileId = req.params.id;
        
//         // 1. AUTHENTICATION & VALIDATION
//         const userEmail = req.user.sub;
//         if (!userEmail) {
//             return res.status(401).json({ message: "Invalid token - user email not found" });
//         }

//         const user = await User.findOne({ email: userEmail.toLowerCase().trim() }).select('_id');
//         if (!user) {
//             return res.status(401).json({ message: "User found" });
//         }
        
//         const userId = user._id;
//         const userIdString = userId.toString();

//         // 2. FETCH FILE FROM MONGODB
//         // We need the remote path stored in your DB to tell MEGA CMD what to delete
//         const file = await File.findOne({ _id: fileId, user: userId });
//         if (!file) {
//             return res.status(404).json({ message: "File not found" });
//         }

//         // 3. MEGA CMD DELETION
//         // Instead of megaFile.delete(), we call the mega-rm shell command.
//         // NOTE: Ensure your 'file' model stores the 'remotePath' (e.g., /Root/uploads/file.mp4)
//         const remotePath = file.url; 

//         if (remotePath) {
//             try {
//                 // 'mega-rm' deletes the file. 
//                 // We wrap the path in quotes to handle spaces in filenames.
//                 const parts = remotePath.split('/');
//                 const idWithKey = parts[parts.length - 1];
//                 const fileHandle = idWithKey.split('#')[0].split('.')[0]; 

//             console.log(`Attempting to delete MEGA handle: ${fileHandle}`);

//             // 2. Execute mega-rm using the handle: prefix
//             // This tells MEGA CMD to look for the internal ID rather than a file path
//             await execPromise(`mega-rm "handle:${fileHandle}"`);
//                 // await execPromise(`mega-rm "${remotePath}"`);
//             console.log(`✅ File "${file.originalName}" deleted from MEGA CMD server`);
//             } catch (megaError) {
//                 // If MEGA CMD fails (e.g. file already gone), we log and proceed to clean DB
//                 console.warn(`⚠️ MEGA CMD delete failed for: ${remotePath}. Error: ${megaError.message}`);
//             }
//         } else {
//             console.warn("⚠️ No remote path found for MEGA deletion, skipping storage removal.");
//         }

//         // 4. DATABASE DELETION
//         const deletedFileType = file.fileType;
//         const deletedFileId = file._id.toString();
//         await File.deleteOne({ _id: fileId });
//         console.log(`✅ Metadata for ${deletedFileId} removed from MongoDB`);

//         // 5. REDIS CACHE INVALIDATION
//         const invalidateCache = async () => {
//             try {
//                 // Remove specific user file lists
//                 await cacheMethods.del(userIdString);
//                 await cacheMethods.del(userIdString + ':recent10');
//                 console.log(`[Cache] Invalidated cache for user: ${userIdString}`);
//             } catch (e) {
//                 console.error('[Cache] Error invalidating cache:', e);
//             }
//         };
//         await invalidateCache();

//         // 6. REDIS UPDATE (Sorted Sets / Recent Files)
//         try {
//             await redisService.removeFileFromRecent(userIdString,deletedFileId,deletedFileType);
//             console.log(`[Redis] Removed file from recent lists`);
//         } catch (recentErr) {
//             console.error('[RecentFiles] Error removing file from recent lists:', recentErr);
//         }
        
//         return res.status(200).json({ message: "file deleted successfully" });

//     } catch (err) {
//         console.error("Delete operation failed:", err);
//         return res.status(500).json({
//             message: "Delete Failed",
//             error: err.message
//         });
//     }
// };



const File = require('../../models/file');
const User = require('../../models/userModel');
const { cacheMethods } = require('../../utils/redisCache');
const redisService = require('../../utils/redisService');
const { exec } = require('child_process');
const util = require('util');
const { getMegaCmdPath } = require('../../utils/megaCmdPath');

// Promisify exec for clean async/await usage
const execPromise = util.promisify(exec);

const deleteFile = async (req, res) => {
    try {
        const fileId = req.params.id;
        const userEmail = req.user.sub; // From JWT

        // 1. Authenticate User
        const user = await User.findOne({ email: userEmail.toLowerCase().trim() }).select('_id');
        if (!user) return res.status(401).json({ message: "User not found" });
        
        const userIdString = user._id.toString();

        // 2. Fetch File from MongoDB
        // We now rely on the 'remotePath' field we added during upload
        const file = await File.findOne({ _id: fileId, user: user._id });
        if (!file) return res.status(404).json({ message: "File not found or unauthorized" });

        // 3. MEGA CMD DELETION
       if (file.remotePath) {
            try {
                const megaRmPath = getMegaCmdPath('mega-rm');
                const megaCmd = `${megaRmPath} -f "${file.remotePath}"`;
                await execPromise(megaCmd);
                console.log(`✅ File deleted from MEGA cloud storage`);
            } catch (megaError) {
                console.warn(`⚠️ MEGA delete failed: ${megaError.message}`);
            }
        } else {
                // If the DB field is missing, we can't delete from MEGA, 
                // but we SHOULD still delete from MongoDB to fix your UI.
                console.warn("⚠️ No remotePath found. This is likely an old file. Cleaning DB only.");
                }

        // 4. DATABASE DELETION
        // Capture metadata needed for Redis cleanup before deleting the record
        const deletedFileType = file.fileType;
        const deletedFileId = file._id.toString();
        
        await File.deleteOne({ _id: fileId });
        console.log(`✅ Metadata removed from MongoDB`);

        // 5. REDIS CACHE & RECENT LISTS CLEANUP
        try {
            // Remove full list cache
            await cacheMethods.del(userIdString);
            await cacheMethods.del(`${userIdString}:recent10`);
            
            // Remove from sorted sets (Recent Files)
            await redisService.removeFileFromRecent(userIdString, deletedFileId, deletedFileType);
            
            console.log(`[Cache/Redis] Cleanup complete for user: ${userIdString}`);
        } catch (cacheErr) {
            console.error('[Cache] Cleanup error:', cacheErr.message);
        }

        // 6. SUCCESS RESPONSE
        return res.status(200).json({ 
            message: "File deleted successfully",
            fileId: deletedFileId 
        });

    } catch (err) {
        console.error("Delete operation failed:", err);
        res.status(500).json({ 
            message: "Internal Server Error", 
            error: err.message 
        });
    }
};

module.exports = { deleteFile };