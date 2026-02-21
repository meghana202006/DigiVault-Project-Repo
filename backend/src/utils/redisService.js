const { redis } = require('./redisCache');
const File = require('../models/file');

const GLOBAL_KEY = 'recent_files:global';
const SECTION_PREFIX = 'recent_files:section:';
const USER_PREFIX = 'recent_files:user:';

const redisService = {
  /**
   * Seeds recent files from database for a user (one-time migration).
   * Call this when the sorted sets are empty to populate from existing files.
   * @param {string} userId - User ID
   */
  async seedRecentFilesFromDB(userId) {
    try {
      const userIdStr = userId.toString();
      
      // Check if already seeded (user key has data)
      const existingCount = await redis.zcard(`${USER_PREFIX}${userIdStr}`);
      if (existingCount > 0) {
        console.log(`[RecentFiles] User ${userIdStr} already has ${existingCount} recent files, skipping seed`);
        return;
      }

      // Fetch 10 most recent files from database
      const files = await File.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('-url -key')
        .lean();

      if (files.length === 0) {
        console.log(`[RecentFiles] No files found for user ${userIdStr}, nothing to seed`);
        return;
      }

      // Add each file to the sorted sets
      for (const file of files) {
        await this.addFile(file, file.fileType, userIdStr);
      }

      console.log(`[RecentFiles] Seeded ${files.length} recent files for user ${userIdStr}`);
    } catch (error) {
      console.error('[RecentFiles] Error seeding recent files:', error);
    }
  },

  /**
   * Adds a file to Global, Section-specific, and User-specific recent lists.
   * Keeps only the 10 most recent in each list using sorted sets.
   * @param {Object} file - File object with _id, name, originalName, size, mimeType, fileType, createdAt
   * @param {string} sectionId - Section type (document, image, audio, video, private)
   * @param {string} userId - User ID for user-specific recent files
   */
  async addFile(file, sectionId, userId) {
    try {
      const timestamp = file.createdAt ? new Date(file.createdAt).getTime() : Date.now();
      const fileData = JSON.stringify({
        _id: file._id?.toString() || file.id,
        name: file.name,
        originalName: file.originalName || file.name,
        size: file.size,
        mimeType: file.mimeType,
        fileType: file.fileType || sectionId,
        sectionId: sectionId,
        userId: userId,
        createdAt: file.createdAt || new Date().toISOString()
      });

      const pipeline = redis.pipeline();

      // Global: Add and keep only 10 most recent
      pipeline.zadd(GLOBAL_KEY, timestamp, fileData);
      pipeline.zremrangebyrank(GLOBAL_KEY, 0, -11);

      // Section-specific: Add and keep only 10
      const sectionKey = `${SECTION_PREFIX}${sectionId}`;
      pipeline.zadd(sectionKey, timestamp, fileData);
      pipeline.zremrangebyrank(sectionKey, 0, -11);

      // User-specific: Add and keep only 10
      if (userId) {
        const userKey = `${USER_PREFIX}${userId}`;
        pipeline.zadd(userKey, timestamp, fileData);
        pipeline.zremrangebyrank(userKey, 0, -11);

        // User + Section specific
        const userSectionKey = `${USER_PREFIX}${userId}:${sectionId}`;
        pipeline.zadd(userSectionKey, timestamp, fileData);
        pipeline.zremrangebyrank(userSectionKey, 0, -11);
      }

      await pipeline.exec();
      console.log(`[RecentFiles] Added file "${file.name}" to recent lists (global, ${sectionId}, user:${userId})`);
    } catch (error) {
      console.error('[RecentFiles] Error adding file:', error);
      // Retry once on transient Redis errors so the list stays updated
      try {
        const timestamp = file.createdAt ? new Date(file.createdAt).getTime() : Date.now();
        const fileData = JSON.stringify({
          _id: file._id?.toString() || file.id,
          name: file.name,
          originalName: file.originalName || file.name,
          size: file.size,
          mimeType: file.mimeType,
          fileType: file.fileType || sectionId,
          sectionId: sectionId,
          userId: userId,
          createdAt: file.createdAt || new Date().toISOString()
        });
        const pipeline = redis.pipeline();
        pipeline.zadd(GLOBAL_KEY, timestamp, fileData);
        pipeline.zremrangebyrank(GLOBAL_KEY, 0, -11);
        const sectionKey = `${SECTION_PREFIX}${sectionId}`;
        pipeline.zadd(sectionKey, timestamp, fileData);
        pipeline.zremrangebyrank(sectionKey, 0, -11);
        if (userId) {
          pipeline.zadd(`${USER_PREFIX}${userId}`, timestamp, fileData);
          pipeline.zremrangebyrank(`${USER_PREFIX}${userId}`, 0, -11);
          pipeline.zadd(`${USER_PREFIX}${userId}:${sectionId}`, timestamp, fileData);
          pipeline.zremrangebyrank(`${USER_PREFIX}${userId}:${sectionId}`, 0, -11);
        }
        await pipeline.exec();
        console.log('[RecentFiles] Retry succeeded for addFile');
      } catch (retryErr) {
        console.error('[RecentFiles] Retry failed for addFile:', retryErr);
      }
    }
  },

  /**
   * Removes a file from all recent lists when deleted.
   * @param {string} fileId - The file ID to remove
   * @param {string} sectionId - Section type
   * @param {string} userId - User ID
   */
  async removeFile(fileId, sectionId, userId) {
    try {
      const fileIdStr = fileId?.toString();
      
      // Search in global list and remove
      const globalFiles = await redis.zrange(GLOBAL_KEY, 0, -1);
      const globalToRemove = globalFiles.find(f => {
        try {
          const parsed = JSON.parse(f);
          return parsed._id === fileIdStr || parsed.id === fileIdStr;
        } catch { return false; }
      });

      const pipeline = redis.pipeline();

      if (globalToRemove) {
        pipeline.zrem(GLOBAL_KEY, globalToRemove);
      }

      // Remove from section list
      if (sectionId) {
        const sectionKey = `${SECTION_PREFIX}${sectionId}`;
        const sectionFiles = await redis.zrange(sectionKey, 0, -1);
        const sectionToRemove = sectionFiles.find(f => {
          try {
            const parsed = JSON.parse(f);
            return parsed._id === fileIdStr || parsed.id === fileIdStr;
          } catch { return false; }
        });
        if (sectionToRemove) {
          pipeline.zrem(sectionKey, sectionToRemove);
        }
      }

      // Remove from user lists
      if (userId) {
        const userKey = `${USER_PREFIX}${userId}`;
        const userFiles = await redis.zrange(userKey, 0, -1);
        const userToRemove = userFiles.find(f => {
          try {
            const parsed = JSON.parse(f);
            return parsed._id === fileIdStr || parsed.id === fileIdStr;
          } catch { return false; }
        });
        if (userToRemove) {
          pipeline.zrem(userKey, userToRemove);
        }

        // User + Section specific
        if (sectionId) {
          const userSectionKey = `${USER_PREFIX}${userId}:${sectionId}`;
          const userSectionFiles = await redis.zrange(userSectionKey, 0, -1);
          const userSectionToRemove = userSectionFiles.find(f => {
            try {
              const parsed = JSON.parse(f);
              return parsed._id === fileIdStr || parsed.id === fileIdStr;
            } catch { return false; }
          });
          if (userSectionToRemove) {
            pipeline.zrem(userSectionKey, userSectionToRemove);
          }
        }
      }

      await pipeline.exec();
      console.log(`[RecentFiles] Removed file ${fileIdStr} from recent lists`);
    } catch (error) {
      console.error('[RecentFiles] Error removing file:', error);
    }
  },

  /**
   * Fetches the 10 most recent files.
   * @param {Object} options - Query options
   * @param {string} options.sectionId - Filter by section (optional)
   * @param {string} options.userId - Filter by user (optional)
   * @param {number} options.limit - Number of files to return (default 10)
   * @returns {Array} Array of recent file objects
   */
  async getRecentFiles({ sectionId = null, userId = null, limit = 10 } = {}) {
    try {
      let key;

      if (userId && sectionId) {
        key = `${USER_PREFIX}${userId}:${sectionId}`;
      } else if (userId) {
        key = `${USER_PREFIX}${userId}`;
      } else if (sectionId) {
        key = `${SECTION_PREFIX}${sectionId}`;
      } else {
        key = GLOBAL_KEY;
      }

      // ZREVRANGE gets highest scores (newest) first
      const data = await redis.zrevrange(key, 0, limit - 1);
      return data.map(item => {
        try {
          return JSON.parse(item);
        } catch {
          return null;
        }
      }).filter(Boolean);
    } catch (error) {
      console.error('[RecentFiles] Error fetching recent files:', error);
      return [];
    }
  },

  /**
   * Clears all recent files for a user (e.g., on account deletion).
   * @param {string} userId - User ID
   */
  async clearUserRecentFiles(userId) {
    try {
      const userKey = `${USER_PREFIX}${userId}`;
      
      // Get all section keys for this user
      const sections = ['document', 'image', 'audio', 'video', 'private'];
      const pipeline = redis.pipeline();
      
      pipeline.del(userKey);
      sections.forEach(section => {
        pipeline.del(`${userKey}:${section}`);
      });

      await pipeline.exec();
      console.log(`[RecentFiles] Cleared all recent files for user ${userId}`);
    } catch (error) {
      console.error('[RecentFiles] Error clearing user recent files:', error);
    }
  }
};

module.exports = redisService;
