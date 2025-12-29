const mongoose = require("mongoose");

const connectDB = async ()=>{
    try{
        const connect = await mongoose.connect(process.env.MONGO_URI);
        console.log("mongodb is connected");
    } catch(err) {
        console.log(`error will connecting in DB ${err.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;