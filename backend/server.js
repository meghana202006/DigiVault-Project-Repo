const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const connectDB = require('./src/config/db');
const userRoutes = require('./src/routes/userRoutes');
const fileRoutes = require('./src/routes/fileRoutes');
const {connectToMega} = require('./src/config/mega');
const { redis } = require('./src/utils/redisCache'); // Import Redis connection from cacheMethods

dotenv.config();
connectDB();
connectToMega();

const app = express();

app.use(express.json());
app.use(cookieParser()); // Parse cookies from request
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests from both localhost ports (for development)
        const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174','http://localhost:3000'];
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true                // ALLOWS the browser to save the cookie
}));
// Configure Helmet to allow cookies
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false
}));

app.use(express.json());

// Redis connection event handlers (using imported redis from cacheMethods)
redis.on('connect', () => {
    console.log('[Redis] Connecting to Redis...');
});

redis.on('ready', () => {
    console.log('[Redis] Redis client ready');
});

redis.on('error', (err) => {
    console.error('[Redis] Redis connection error:', err);
});

redis.on('close', () => {
    console.log('[Redis] Redis connection closed');
});

redis.on('reconnecting', () => {
    console.log('[Redis] Reconnecting to Redis...');
});
// users
app.use('/api/users', userRoutes);

// files
app.use('/api/files', fileRoutes);


const PORT = process.env.PORT || 5000

const start = async () =>{
    try{
        await connectToMega();
        app.listen(PORT, ()=>{
            console.log(`server is running on ${PORT}`);
        });
    } catch(error){
        console.log(`Error in starting the server ${error}`);
        process.exit(1);
    }
}

start();
