const File = require('../../models/File');
const User = require('../../models/userModel');
const { getStorage } = require('../../config/mega');
const { decryptPasskey, decryptFileLink } = require('../../utils/crypto');

const deleteFile = async (req,res) => {
    try {
        const fileId = req.params.id;
        const userId = req.user.id;

        // find the file in mongo
        const file = await File.findOne({_id: fileId, user: userId});
        if(!file){
            return res.status(404).json({message:"File not found"});
        }

        // decrypt user passkey and file link
        const user = await User.findById(userId);
        const rawPasskey = decryptPasskey(user.passkey);
        const megaLink = decryptFileLink(file.url, rawPasskey);

        // extract link we need the handel from the link to delete 
        const Linkhandel = megaLink.split('/file/')[1].split('#')[0];

        // find and delete from mega
        const storage = getStorage();
        let megaFile;

        if (storage.files && storage.files[Linkhandel]) {
            megaFile = storage.files[Linkhandel];
        } 
        // METHOD B: Root Search (The backup way - if .files is missing)
        else if (storage.root && storage.root.children) {
            megaFile = storage.root.children.find(f => f.Linkhandel === Linkhandel);
        }

        if(megaFile) {
            await new Promise((resolve, reject) => {
                megaFile.delete((err) => {
                    if(err) reject(err);
                    else resolve();
                });
            });
            console.log(`deleted form mega; ${file.originalName}`);
        } else {
            console.log("File not found on mega, might have been deleted manually, removing from DB..");
        }

        await File.deleteOne({_id:fileId});
        res.status(200).json({message:"file deleted successfully"});

    } catch (err) {
        console.error("delete error: ", err);
        res.status(500).json({message:`Delete Failed${err.message}`});
    }
};

module.exports = { deleteFile };