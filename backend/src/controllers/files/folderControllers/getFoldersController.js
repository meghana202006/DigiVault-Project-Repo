const Folder = require('../../../models/folderModel');
const User = require('../../../models/userModel');
const { normalizeSectionType } = require('../../../utils/sectionTypeHelper');

const getFolders = async (req, res) => {
    try {
        const { sectionType } = req.query;

        // Get user from JWT token
        const userEmail = req.user.sub;
        if (!userEmail) {
            return res.status(401).json({ message: "Invalid token - user email not found" });
        }

        // Fetch user from database to get the MongoDB ObjectId and verify MEGA storage
        const user = await User.findOne({ email: userEmail.toLowerCase().trim() }).select('_id megaStorage');
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        // Verify user has MEGA Storage setup (ensures folders are in user's folder structure)
        if(!user.megaStorage || !user.megaStorage.rootNodeId){
            return res.status(400).json({
                message:"User does not have a MEGA Storage setup. Folders cannot be retrieved."
            });
        }

        // Ensure we have the user ID
        const userId = user._id;
        if (!userId) {
            return res.status(500).json({ message: "User ID not found in database" });
        }

        // Build query - use userId from database (MongoDB ObjectId)
        const query = { user: userId };
        
        // Filter by sectionType if provided
        if (sectionType) {
            // Normalize section type to match enum: ['Documents', 'Images', 'Audio', 'Videos', 'Private']
            let normalizedSectionType;
            try {
                normalizedSectionType = normalizeSectionType(sectionType);
            } catch (normalizeError) {
                return res.status(400).json({
                    message: normalizeError.message || "Invalid section type provided"
                });
            }
            query.sectionType = normalizedSectionType;
        }

        // Get folders from database
        // Folders are already nested in user's folder structure:
        // User Root > Section Type > Folder
        // So filtering by user ID ensures we only get folders from user's structure
        const folders = await Folder.find(query)
            .select('_id name sectionType createdAt')
            .sort({ createdAt: -1 }); // Newest first

        console.log(`Found ${folders.length} folders for user ${userId} (Root: ${user.megaStorage.rootNodeId}), sectionType: ${query.sectionType || 'all'}`);
        console.log('Folders:', folders.map(f => ({ id: f._id, name: f.name, sectionType: f.sectionType })));

        res.status(200).json({
            message: "Folders retrieved successfully",
            folders: folders
        });
    } catch (err) {
        console.error("Error fetching folders:", err);
        res.status(500).json({
            message: "Error fetching folders",
            error: err.message || "Internal server error"
        });
    }
};

module.exports = { getFolders };

