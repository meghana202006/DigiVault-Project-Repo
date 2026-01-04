const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');


const connectDB = require('./src/config/db');
const userRoutes = require('./src/routes/userRoutes');

dotenv.config();
connectDB();

const app = express();

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


app.get("/", (req,res) =>{
    res.send("yeeeeeeeeeeeeeeeea");
});


app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000
app.listen(PORT, ()=>{
    console.log("server is running");
});