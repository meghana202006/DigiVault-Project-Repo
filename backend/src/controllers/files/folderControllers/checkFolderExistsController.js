const Folder = require('../../../models/folderModel');
const User = require('../../../models/userModel');
const { normalizeSectionType } = require('../../../utils/sectionTypeHelper');

const checkFolderExists = async (req, res) => {
    try {
        const { name, sectionType } = req.query;

        if (!name || !sectionType) {
            return res.status(400).json({ 
                exists: false,
                message: "Name and section type are required" 
            });
        }

        // Get user from JWT token (email is in 'sub' field)
        const userEmail = req.user.sub;
        if (!userEmail) {
            return res.status(401).json({ 
                exists: false,
                message: "Invalid token - user email not found" 
            });
        }

        // Fetch user from database to get MongoDB ObjectId (ensures consistency)
        const user = await User.findOne({ email: userEmail.toLowerCase().trim() }).select('_id');
        if (!user) {
            return res.status(401).json({ 
                exists: false,
                message: "User not found" 
            });
        }
        
        // Use MongoDB ObjectId from database (not from token)
        const userId = user._id;
        if (!userId) {
            return res.status(500).json({ 
                exists: false,
                message: "User ID not found in database" 
            });
        }

        // Normalize section type
        let normalizedSectionType;
        try {
            normalizedSectionType = normalizeSectionType(sectionType);
        } catch (normalizeError) {
            return res.status(400).json({
                exists: false,
                message: normalizeError.message || "Invalid section type provided"
            });
        }

        // Check if folder exists for this user with the same name and section type
        // Note: Folder model has name as lowercase and unique, so we need to check case-insensitively
        const normalizedName = name.toLowerCase().trim();
        
        console.log(`Checking folder availability in database: userId=${userId}, name="${normalizedName}", sectionType="${normalizedSectionType}"`);
        
        const existingFolder = await Folder.findOne({
            user: userId,
            name: normalizedName,
            sectionType: normalizedSectionType
        }).select('_id name');

        const folderExists = !!existingFolder;
        console.log(`Database query result: Folder ${folderExists ? 'EXISTS' : 'NOT FOUND'} for user ${userId}`);

        res.status(200).json({
            exists: folderExists,
            message: existingFolder 
                ? "A folder with this name already exists in this section" 
                : "Folder name is available"
        });
    } catch (err) {
        console.error("Error checking folder existence:", err);
        res.status(500).json({
            exists: false,
            message: "Error checking folder name",
            error: err.message || "Internal server error"
        });
    }
};

module.exports = { checkFolderExists };

