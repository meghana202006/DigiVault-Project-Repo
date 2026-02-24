const { redis } = require('./redisCache');
const File = require('../models/file')

const redisService = {
    /**
     * Adds a file to the user's recent list in Redis.
     */
    addFileToRecent: async (userId, fileData, sectionType) => {
        const globalKey = `recent:user:${userId}:all`;
        const sectionKey = `recent:user:${userId}:${sectionType}`;
        const timestamp = Date.now();
        
        const member = typeof fileData === 'object' ? JSON.stringify(fileData) : fileData;

        const pipeline = redis.pipeline();
        pipeline.zadd(globalKey, timestamp, member);
        pipeline.zadd(sectionKey, timestamp, member);
        pipeline.zremrangebyrank(globalKey, 0, -11);
        pipeline.zremrangebyrank(sectionKey, 0, -11);
        await pipeline.exec();
    },

    /**
     * Fetches recent files from Redis (Newest first).
     */
    getRecentFiles: async ({ userId, sectionId, limit }) => {
        const key = sectionId && sectionId !== 'all' 
            ? `recent:user:${userId}:${sectionId}` 
            : `recent:user:${userId}:all`;

        const rawData = await redis.zrevrange(key, 0, limit - 1);

        return rawData.map(item => {
            try {
                return JSON.parse(item);
            } catch (e) {
                return item;
            }
        });
    },

    /**
     * Migration: Pull latest files from DB if Redis is empty.
     */
    sendRecentFilesFromDB: async (userId) => {
        const globalKey = `recent:user:${userId}:all`;
        const count = await redis.zcard(globalKey);
        
        if (count > 0) return;

        const recentFiles = await File.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        if (recentFiles.length === 0) return;

        const pipeline = redis.pipeline();
        recentFiles.forEach(file => {
            const score = new Date(file.createdAt).getTime();
            const { url, security, ...safeFile } = file; 
            pipeline.zadd(globalKey, score, JSON.stringify(safeFile));
        });

        await pipeline.exec();
    },

    /**
     * Removes a file from the recent sets.
     */
    removeFileFromRecent: async (userId, fileData, sectionType) => {
        const globalKey = `recent:user:${userId}:all`;
        const sectionKey = `recent:user:${userId}:${sectionType}`;
        const member = typeof fileData === 'object' ? JSON.stringify(fileData) : fileData;

        const pipeline = redis.pipeline();
        pipeline.zrem(globalKey, member);
        pipeline.zrem(sectionKey, member);
        await pipeline.exec();
    }
};

module.exports = redisService;