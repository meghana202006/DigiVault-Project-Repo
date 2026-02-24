const { spawn } = require('child_process');
const Folder = require('../../../models/folderModel');
const User = require('../../../models/userModel');
const { cacheMethods } = require('../../../utils/redisCache');
const { getMegaCmdPath } = require('../../../utils/megaCmdPath');

/**
 * Deletes a folder from MEGA via spawn and cleans up MongoDB metadata.
 */
const deleteFolder = async (req, res) => {
    try {
        const folderId = req.params.id;

        // 1. AUTHENTICATION & OWNERSHIP
        let userId = req.user.id;
        if (!userId) {
            const userEmail = req.user.sub;
            if (!userEmail) return res.status(401).json({ message: "Invalid token" });

            const user = await User.findOne({ email: userEmail.toLowerCase().trim() }).select('_id');
            if (!user) return res.status(401).json({ message: "User not found" });
            userId = user._id;
        }

        // 2. FETCH FOLDER DATA
        const folder = await Folder.findOne({ _id: folderId, user: userId });
        if (!folder) return res.status(404).json({ message: "Folder not found" });

        // 3. MEGA CMD PATH RESOLUTION
        const megaRmPath = getMegaCmdPath('mega-rm');
        const pathToDelete = folder.remotePath || `handle:${folder.megaNodeId}`;

        console.log(`[Cloud] Attempting delete at: ${pathToDelete}`);

        // 4. EXECUTE VIA SPAWN WITH SHELL ENABLED
        /**
         * CHANGE MADE: Added { shell: true }. 
         * On Windows, this allows Node to find .cmd or .bat files and resolves the ENOENT error.
         */
        const child = spawn(megaRmPath, ['-rf', pathToDelete], { shell: true });

        let errorData = '';

        // CHANGE MADE: Added 'error' listener.
        // This prevents the server from crashing if the 'mega-rm' command is missing.
        child.on('error', (err) => {
            console.error("❌ Failed to start MEGA process:", err.message);
            if (!res.headersSent) {
                return res.status(500).json({ 
                    message: "MEGA CMD not found or failed to start", 
                    error: err.message 
                });
            }
        });

        // Capture stderr (standard error output) from MEGA CMD
        child.stderr.on('data', (data) => {
            errorData += data.toString();
        });

        // 5. SYNCED CALLBACK ON COMPLETION
        child.on('close', async (code) => {
            if (code === 0) {
                // SUCCESS: Proceed to Database deletion
                await Folder.deleteOne({ _id: folderId });
                
                // 6. CACHE INVALIDATION
                try {
                    const uidString = userId.toString();
                    await cacheMethods.del(uidString);
                    await cacheMethods.del(`${uidString}:recent10`);
                } catch (cacheErr) {
                    console.warn('[Cache] Could not clear cache.');
                }

                console.log(`✅ Synced Delete Success: ${folder.name}`);

                if (!res.headersSent) {
                    return res.status(200).json({
                        message: "Folder deleted successfully from Cloud and DB",
                        folderId: folderId
                    });
                }
            } else {
                // FAILURE: Cloud didn't delete, so we keep the DB record
                console.error(`❌ MEGA CMD Error [Code ${code}]: ${errorData}`);
                if (!res.headersSent) {
                    return res.status(500).json({ 
                        message: "Cloud deletion failed. Sync preserved.",
                        error: errorData.trim()
                    });
                }
            }
        });

    } catch (err) {
        console.error("Internal Delete Error:", err);
        if (!res.headersSent) {
            res.status(500).json({ message: "Internal Server Error" });
        }
    }
};

module.exports = { deleteFolder };