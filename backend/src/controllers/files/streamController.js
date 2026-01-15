const File = require('../../models/File');
const User = require('../../models/userModel');
const { getStorage } = require('../../config/mega'); // We need this to verify connection
const { decryptPasskey, decryptFileLink } = require('../../utils/crypto'); // We need to make this function!
const { File: MegaFile } = require('megajs'); // Import MegaJS File class

const streamFile = async (req, res) => {
    try {
        const fileId = req.params.id;
        const userId = req.user.id;

        // Find the file and ensure it belongs to the user
        const fileDoc = await File.findOne({ _id: fileId, user: userId });
        // file check
        if (!fileDoc) {
            return res.status(404).json({ message: "File not found" });
        }

        // Get User's Encrypted Passkey
        const user = await User.findById(userId);
        if (!user || !user.passkey) {
            return res.status(500).json({ message: "User security key missing." });
        }

        // Decrypt the User's Passkey
        const rawUserPasskey = decryptPasskey(user.passkey);

        // Decrypt the MEGA Link using User's Passkey
        const megaLink = decryptFileLink(fileDoc.url, rawUserPasskey);

        // Connect to MEGA and Stream
        const file = MegaFile.fromURL(megaLink);

        // Load attributes (name, size) from MEGA to ensure link is valid
        await file.loadAttributes();

        // Set Headers so the browser knows it's a video/image
        res.setHeader('Content-Type', fileDoc.mimeType);
        res.setHeader('Content-Length', fileDoc.size);
        
        // Pipe the stream (download from MEGA -> send to User)
        file.download().pipe(res);

    } catch (error) {
        console.error("Stream Error:", error);
        res.status(500).json({ message: "Failed to stream file", error: error.message });
    }
};

module.exports = { streamFile };