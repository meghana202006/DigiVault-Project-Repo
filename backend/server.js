const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');


const connectDB = require('./src/config/db');
const userRoutes = require('./src/routes/userRoutes');

dotenv.config();
connectDB();

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());


app.get("/", (req,res) =>{
    res.send("yeeeeeeeeeeeeeeeea");
});


app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000
app.listen(PORT, ()=>{
    console.log("server is running");
});