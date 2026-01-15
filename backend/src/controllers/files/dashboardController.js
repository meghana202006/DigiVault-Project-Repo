const file = require('../../models/file');
const File = require('../../models/file');

// send list of the data user has
const getAllFiles = async(req, res) => {
    try {
        const userId = req.user.id;
        
        // find all files, new to old, remove the url key
        const files = await File.find({user: userId})
                                .sort({createdAt: -1})
                                .select('-url -key');

        res.status(200).json({
            message:"Files fetched successfully",
            count: files.length,
            files: files
        })

    }  catch(err){
        console.log("dashboard error", err);
        res.status(500).json({
            message:"Failed to load files", error: err.message
        });
    }
};

module.exports = {getAllFiles};