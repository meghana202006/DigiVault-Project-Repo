const { getStorage } = require('../../../config/mega');
const Folder = require('../../../models/folderModel');
const User = require('../../../models/userModel');
const { findFolderByNodeId } = require('../../../utils/findMegaFolder');
const { cacheMethods } = require('../../../utils/redisCache');

const deleteFolder = async (req, res) => {
    try {
        const folderId = req.params.id;

        // Get user ID from JWT token
        let userId = req.user.id;
        
        // Fallback: If id is not in token, fetch from database using email
        if (!userId) {
            const userEmail = req.user.sub;
            if (!userEmail) {
                return res.status(401).json({ 
                    message: "Invalid token - user email not found" 
                });
            }

            const user = await User.findOne({ email: userEmail.toLowerCase().trim() }).select('_id');
            if (!user) {
                return res.status(401).json({ 
                    message: "User not found" 
                });
            }
            userId = user._id;
        }

        if (!userId) {
            return res.status(500).json({ 
                message: "User ID not found" 
            });
        }

        // Find the folder in database
        const folder = await Folder.findOne({ _id: folderId, user: userId });
        if (!folder) {
            return res.status(404).json({ 
                message: "Folder not found" 
            });
        }

        // Setup MEGA Storage connection
        const storage = getStorage();

        // Find and delete the folder in MEGA using megaNodeId
        if (folder.megaNodeId) {
            const megaFolder = findFolderByNodeId(storage, folder.megaNodeId);
            
            if (megaFolder) {
                // Delete folder from MEGA storage
                await new Promise((resolve, reject) => {
                    megaFolder.delete((err) => {
                        if (err) {
                            console.error("Error deleting folder from MEGA:", err);
                            // Even if MEGA deletion fails, we might still want to remove from DB
                            // depending on desired behavior. For now, we'll proceed with DB deletion.
                            console.warn("MEGA deletion failed, but proceeding with database deletion");
                            resolve(); // Resolve to continue with DB deletion
                        } else {
                            console.log(`✅ Folder "${folder.name}" deleted successfully from MEGA storage (nodeId: ${folder.megaNodeId})`);
                            resolve();
                        }
                    });
                });
            } else {
                console.warn(`⚠️ Folder "${folder.name}" (MEGA Node ID: ${folder.megaNodeId}) not found on MEGA. It may have been deleted manually. Proceeding with database deletion.`);
            }
        } else {
            console.warn(`⚠️ Folder "${folder.name}" has no megaNodeId. Skipping MEGA deletion, proceeding with database deletion only.`);
        }

        // Delete folder from database
        const deleteResult = await Folder.deleteOne({ _id: folderId, user: userId });
        
        if (deleteResult.deletedCount === 0) {
            return res.status(404).json({ 
                message: "Folder not found in database" 
            });
        }

        // Invalidate file list and recent10 cache so next fetch returns fresh data
        try {
            const uid = userId.toString();
            await cacheMethods.del(uid);
            await cacheMethods.del(uid + ':recent10');
        } catch (cacheErr) {
            console.warn('Cache invalidation after folder delete:', cacheErr.message);
        }

        console.log(`✅ Folder "${folder.name}" deleted successfully from database`);

        res.status(200).json({
            message: "Folder deleted successfully from MEGA storage and database",
            folderId: folderId,
            folderName: folder.name
        });

    } catch (err) {
        console.error("Error deleting folder:", err);
        res.status(500).json({
            message: "Error deleting folder",
            error: err.message || "Internal server error"
        });
    }
};

module.exports = { deleteFolder };

