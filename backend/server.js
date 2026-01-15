const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');


const connectDB = require('./src/config/db');
const userRoutes = require('./src/routes/userRoutes');
const fileRoutes = require('./src/routes/fileRoutes');
const {connectToMega} = require('./src/config/mega');

dotenv.config();
connectDB();
connectToMega();

const app = express();

<<<<<<< HEAD
app.use(express.json());
app.use(cookieParser()); // Parse cookies from request
app.use(cors({
    origin: 'http://localhost:5173', // EXACT frontend URL (no trailing slash)
    credentials: true                // ALLOWS the browser to save the cookie
}));
// Configure Helmet to allow cookies
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false
}));
=======
app.use(helmet());
>>>>>>> 8eaa2bc008e7a17aa2d27e091256a1934c9a0750

app.use(express.json());
app.use(cors());

// users
app.use('/api/users', userRoutes);

// files
app.use('/api/files', fileRoutes);


const PORT = process.env.PORT || 5000
app.listen(PORT, ()=>{
    console.log(`server is running on ${process.env.PORT}`);
});