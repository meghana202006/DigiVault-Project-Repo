const {getStorage} = require('../../config/mega');
const File = require('../../models/file');
const User = require('../../models/userModel');
const {decryptPasskey, encryptFileLink} = require('../../utils/crypto');

// uploading to mega
const uploadToMega = (fileBuffer, fileName, fileSize) => {
    return new Promise((resolve, reject) => {
        const storage = getStorage();
        storage.upload({ name: fileName, size: fileSize }, fileBuffer, (err, file) => {
            if (err) return reject(err);
            file.link((err, link) => {
                if (err) return reject(err);
                resolve(link);
            });
        });
    });
};

const uploadFile = async (req, res) => {
    try{
        // check if file is uploaded or not
        if (!req.files || req.files.length === 0){
            return res.status(400).json({message:"No file uploaded"});
        }
        // fetching user encryption passkey
        const user = await User.findById(req.user.id);
        // if user or passkey then pass error
        if (!user || !user.passkey) {
            return res.status(400).json({message:"User passkey error"});
        }
        // decrypting the passkey
        const rawUserPasskey = decryptPasskey(user.passkey);
        const saveFiles = []; 
        // process the passkey
        for(const file of req.files){
            // upload to mega
            const megaLink = await uploadToMega(file.buffer, file.originalname, file.size);

            // encrypt link with user passkey
            const encryptedLink = encryptFileLink(megaLink,rawUserPasskey)
            
            // detect type
            let type = 'other';
            if (file.mimetype.startsWith('image/')) type = 'image';
            else if (file.mimetype.startsWith('video/')) type = 'video';
            else if (file.mimetype === 'application/pdf') type = 'document';

            // save to DB
            const newFile = await File.create({
                user: req.user.id,
                name: file.originalname,
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                fileType: type,
                url: encryptedLink
            });

            saveFiles.push({id: newFile._id, name:newFile.name});
        }

            res.status(201).json({
                message:"Upload Successful",
                files: saveFiles
            });
    } catch(err){
        console.log("upload error", err);
        res.status(500).json({message:"upload failed", error: err.message});
    }
};

module.exports = {uploadFile};
