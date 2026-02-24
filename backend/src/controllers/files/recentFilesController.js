const User = require('../../models/userModel');
const redisService = require('../../utils/redisService');

/**
 * Get recent files for the authenticated user.
 * Query params:
 *   - section: Filter by section type (document, image, audio, video, private)
 *   - limit: Number of files to return (default 10, max 20)
 */
const getRecentFiles = async (req, res) => {
    try {
        const userEmail = req.user?.sub;
        if (!userEmail) {
            return res.status(401).json({ message: 'Invalid token - user email not found' });
        }

        const user = await User.findOne({ email: userEmail.toLowerCase().trim() }).select('_id');
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        const userId = user._id.toString();
        const { section, limit: limitParam } = req.query;
        const limit = Math.min(parseInt(limitParam) || 10, 20);

        // Seed recent files from DB if sorted sets are empty (one-time migration)
        await redisService.sendRecentFilesFromDB(user._id);

        const recentFiles = await redisService.getRecentFiles({
            sectionId: section || null,
            userId: userId,
            limit: limit
        });

        return res.status(200).json({
            message: 'Recent files fetched successfully',
            count: recentFiles.length,
            files: recentFiles
        });
    } catch (error) {
        console.error('[RecentFiles] Error fetching recent files:', error);
        return res.status(500).json({
            message: 'Failed to fetch recent files',
            error: error.message
        });
    }
};

/**
 * Get global recent files (across all users) - for admin/public dashboard.
 * Query params:
 *   - section: Filter by section type
 *   - limit: Number of files to return (default 10)
 */
const getGlobalRecentFiles = async (req, res) => {
    try {
        const { section, limit: limitParam } = req.query;
        const limit = Math.min(parseInt(limitParam) || 10, 20);

        const recentFiles = await redisService.getRecentFiles({
            sectionId: section || null,
            userId: null,
            limit: limit
        });

        return res.status(200).json({
            message: 'Global recent files fetched successfully',
            count: recentFiles.length,
            files: recentFiles
        });
    } catch (error) {
        console.error('[RecentFiles] Error fetching global recent files:', error);
        return res.status(500).json({
            message: 'Failed to fetch global recent files',
            error: error.message
        });
    }
};

module.exports = { getRecentFiles, getGlobalRecentFiles };
