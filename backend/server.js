const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');


const connectDB = require('./src/config/db');
const userRoutes = require('./src/routes/userRoutes');
const fileRoutes = require('./src/routes/fileRoutes');
const {connectToMega} = require('./src/config/mega');

dotenv.config();
connectDB();
connectToMega();

const app = express();

app.use(helmet());

app.use(express.json());
app.use(cors());


app.get("/", (req,res) =>{
    res.send("yeeeeeeeeeeeeeeeea");
});


app.use('/api/users', userRoutes);
app.use('/api/files', fileRoutes);


const PORT = process.env.PORT || 5000
app.listen(PORT, ()=>{
    console.log("server is running");
});