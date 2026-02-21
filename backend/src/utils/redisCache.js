const Redis = require('ioredis');

// 1. Connection setup
const redis = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
});

const CACHE_PREFIX = 'files:user:';
const DEFAULT_EXPIRY = parseInt(process.env.CACHE_EXPIRY) || 300; // 5 minutes

// Helper Functions
const cacheMethods = {
    get : async (key)=>{
        try{
            const data = await redis.get(CACHE_PREFIX + key);
            return data ? JSON.parse(data) : null;
        }catch(error){
            console.error('Redis get error:', error);
            return null;
        }
    },

    set : async (key , value , expiry = DEFAULT_EXPIRY)=>{
        try{
            await redis.set(
                CACHE_PREFIX + key,
                JSON.stringify(value),
                'EX',
                expiry
            );
        }catch(error){
            console.error('Redis set error:', error);
            throw error; // Surface so callers can invalidate on failure
        }
    },

    del : async (key)=>{
        try{
            await redis.del(CACHE_PREFIX + key);
        }catch(error){
            console.error('Redis del error:', error);
            throw error; // Surface so callers know cache may still be stale
        }
    }
}

// Export both cacheMethods and redis connection
module.exports = {cacheMethods, redis};
