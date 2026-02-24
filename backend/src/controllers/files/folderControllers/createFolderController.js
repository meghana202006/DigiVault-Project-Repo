// const { getStorage } = require('../../../config/mega');
// const Folder = require('../../../models/folderModel');
// const User = require('../../../models/userModel');
// const { findFolderByNodeId } = require('../../../utils/findMegaFolder');
// const { normalizeSectionType } = require('../../../utils/sectionTypeHelper');

// const createFolder = async (req, res) => {

//     try{
//         const { name, sectionType , parentId } = req.body;

//         // Validating the input
//         if(!name || !sectionType){
//             return res.status(400).json({message:"Name and section type are required"});
//         }

//         // Normalize section type to match enum: ['Documents', 'Images', 'Audio', 'Videos', 'Private']
//         let normalizedSectionType;
//         try {
//             normalizedSectionType = normalizeSectionType(sectionType);
//         } catch (normalizeError) {
//             return res.status(400).json({
//                 message: normalizeError.message || "Invalid section type provided"
//             });
//         }

//         // Get user from JWT token
//         const userEmail = req.user.sub;
//         if(!userEmail){
//             return res.status(401).json({message:"Invalid token - user email not found"});
//         }

//         const user = await User.findOne({ email: userEmail.toLowerCase().trim() }).select('_id megaStorage');
//         if(!user){
//             return res.status(401).json({message:"User not found"});
//         }
        
//         // Check if MEGA Storage is set up
//         if(!user.megaStorage || !user.megaStorage.sectionNodeIds || user.megaStorage.sectionNodeIds.size === 0){
//             return res.status(400).json({message:"User does not have a MEGA Storage setup"});
//         }
        
//         // Ensure we have the user ID
//         const userId = user._id;
//         if (!userId) {
//             console.error("User object:", JSON.stringify(user, null, 2));
//             return res.status(500).json({message:"User ID not found in database"});
//         }

//         // Check if folder with same name already exists for this user in this section
//         const normalizedName = name.toLowerCase().trim();
        
//         console.log(`[Create Folder] Checking for existing folder: userId=${userId}, name="${normalizedName}", sectionType="${normalizedSectionType}"`);
        
//         const existingFolder = await Folder.findOne({
//             user: userId,
//             name: normalizedName,
//             sectionType: normalizedSectionType
//         });

//         if (existingFolder) {
//             console.log(`[Create Folder] Folder already exists: ${existingFolder._id}, name="${existingFolder.name}"`);
//             return res.status(409).json({
//                 message: `A folder with the name "${name}" already exists in the ${normalizedSectionType} section`,
//                 error: "Duplicate folder name"
//             });
//         }
        
//         console.log(`[Create Folder] Folder name is available, proceeding with creation...`);

//         // Setup the MEGA Connection
//         const storage = getStorage();

//         // Verify user has root node ID (user's parent folder in MEGA)
//         if(!user.megaStorage.rootNodeId){
//             return res.status(400).json({message:"User root folder not found in MEGA storage"});
//         }

//         let targetNode;
//         if(parentId){
//             // Create folder inside a parent folder (nested folder)
//             const parentFolder = await Folder.findById(parentId);
//             if(!parentFolder){
//                 return res.status(404).json({message:"Parent folder not found"});
//             }
            
//             // Verify parent folder belongs to the user
//             if(parentFolder.user.toString() !== userId.toString()){
//                 return res.status(403).json({message:"Parent folder does not belong to this user"});
//             }
            
//             targetNode = findFolderByNodeId(storage, parentFolder.megaNodeId);
//             if(!targetNode){
//                 return res.status(404).json({message:"Parent folder not found in MEGA storage"});
//             }
            
//             console.log(`Creating folder '${name}' in parent folder '${parentFolder.name}' (User Root: ${user.megaStorage.rootNodeId} > Section: ${parentFolder.sectionType} > Parent: ${parentFolder.name})`);
//         }else{
//             // Create folder directly in the section type folder
//             // Section folders are already under user's root folder (created during user registration)
//             // Structure: User Root (u_{uuid}) > Section Type (Documents/Images/etc.) > New Folder
//             const sectionNodeId = user.megaStorage.sectionNodeIds.get(normalizedSectionType);
//             if(!sectionNodeId){
//                 return res.status(400).json({
//                     message: `Section '${normalizedSectionType}' not found in user's MEGA storage`,
//                     availableSections: Array.from(user.megaStorage.sectionNodeIds.keys())
//                 });
//             }
            
//             // Find the section folder within user's structure
//             // The sectionNodeIds are stored per user and created during registration,
//             // so they are guaranteed to belong to the user's root folder structure
//             // Structure: User Root (u_{uuid}) > Section Type (Documents/Images/etc.) > New Folder
//             targetNode = findFolderByNodeId(storage, sectionNodeId);
//             if(!targetNode){
//                 return res.status(404).json({
//                     message: `Section folder '${normalizedSectionType}' not found in MEGA storage`,
//                     sectionNodeId: sectionNodeId,
//                     userRootNodeId: user.megaStorage.rootNodeId
//                 });
//             }
            
//             // Log the folder structure for verification
//             console.log(`[User: ${userId}] Creating folder '${name}' in section '${normalizedSectionType}'`);
//             console.log(`[User: ${userId}] Folder structure: User Root (${user.megaStorage.rootNodeId}) > ${normalizedSectionType} (${sectionNodeId}) > ${name}`);
//         }
//         // Creating folder in MEGA Storage (within user's folder structure)
//         console.log(`[User: ${userId}] Creating folder in MEGA at target node: ${targetNode.nodeId}`);
//         const newFolder = await storage.mkdir({
//             name: name,
//             target: targetNode
//         });
//         console.log(`[User: ${userId}] Folder created in MEGA with nodeId: ${newFolder.nodeId}`);
        
//         // Save folder info in DB with parentId if provided
//         // Use normalized section type to match enum
//         // Use userId from the database user document (Mongoose ObjectId) to ensure folder belongs to user
//         console.log(`[User: ${userId}] Saving folder to database with userId: ${userId}`);

//         // Normalize name to lowercase before saving (to match schema)
//         // Note: Schema has lowercase: true, but we normalize here for consistency
//         console.log(`[Create Folder] Saving to database: userId=${userId}, name="${normalizedName}", sectionType="${normalizedSectionType}"`);
        
//         const folder = await Folder.create({
//             user: userId,
//             name: normalizedName,
//             sectionType: normalizedSectionType,
//             megaNodeId: newFolder.nodeId,
//             parentNodeId: parentId || null
//         });
        
//         console.log(`[Create Folder] Folder saved successfully: ${folder._id}`);

//         // Return created folder info
//         res.status(201).json({
//             message:"Folder created successfully",
//             folder: {
//                 _id: folder._id,
//                 name: folder.name,
//                 sectionType: folder.sectionType,
//                 createdAt: folder.createdAt
//             }
//         });
//     } catch (err){
//         console.error("Error creating folder:", err);
//         console.error("Error details:", {
//             code: err.code,
//             name: err.name,
//             message: err.message,
//             keyPattern: err.keyPattern,
//             keyValue: err.keyValue
//         });
        
//         // Handle duplicate key error specifically (MongoDB unique index violation)
//         if (err.code === 11000 || err.name === 'MongoServerError') {
//             // Check if it's a duplicate key error
//             if (err.message && err.message.includes('duplicate key')) {
//                 console.error(`[Create Folder] Duplicate key error detected: ${err.message}`);
//                 return res.status(409).json({
//                     message: `A folder with the name "${name}" already exists in the ${normalizedSectionType || sectionType} section`,
//                     error: "Duplicate folder name",
//                     details: "This folder name is already in use. Please choose a different name."
//                 });
//             }
//         }
        
//         res.status(500).json({
//             message:"Error creating folder",
//             error: err.message || "Internal server error"
//         });
//     }
// }

// module.exports = { createFolder };

const { getStorage } = require('../../../config/mega');
const Folder = require('../../../models/folderModel');
const User = require('../../../models/userModel');
const path = require('path'); // Node.js path module for POSIX paths
const { findFolderByNodeId } = require('../../../utils/findMegaFolder');
const { normalizeSectionType } = require('../../../utils/sectionTypeHelper');

const createFolder = async (req, res) => {
    try {
        const { name, sectionType, parentId } = req.body;

        if (!name || !sectionType) {
            return res.status(400).json({ message: "Name and section type are required" });
        }

        let normalizedSectionType = normalizeSectionType(sectionType);

        const userEmail = req.user.sub;
        const user = await User.findOne({ email: userEmail.toLowerCase().trim() }).select('_id megaStorage');
        
        if (!user || !user.megaStorage?.uuid) {
            return res.status(401).json({ message: "User or MEGA setup not found" });
        }

        const userId = user._id;
        const normalizedName = name.trim(); // Keep case if you want, or .toLowerCase() per your schema

        // 1. CONSTRUCT THE BASE REMOTE PATH
        // Pattern: /u_uuid/SectionName
        const userFolderName = `u_${user.megaStorage.uuid}`;
        let remotePathPrefix = `/${userFolderName}/${normalizedSectionType}`;

        let targetNode;
        let finalRemotePath;

        const storage = getStorage();

        // 2. DETERMINE TARGET NODE AND FINAL PATH
        if (parentId) {
            const parentFolder = await Folder.findById(parentId);
            if (!parentFolder || !parentFolder.remotePath) {
                return res.status(404).json({ message: "Parent folder not found or missing path" });
            }
            
            targetNode = findFolderByNodeId(storage, parentFolder.megaNodeId);
            // If nested, Path = /parent/path/newFolder
            finalRemotePath = path.posix.join(parentFolder.remotePath, normalizedName);
        } else {
            const sectionNodeId = user.megaStorage.sectionNodeIds.get(normalizedSectionType);
            targetNode = findFolderByNodeId(storage, sectionNodeId);
            // If top-level, Path = /u_uuid/Section/newFolder
            finalRemotePath = path.posix.join(remotePathPrefix, normalizedName);
        }

        if (!targetNode) {
            return res.status(404).json({ message: "Target location not found in MEGA" });
        }

        // 3. CREATE IN MEGA
        const newMegaFolder = await storage.mkdir({
            name: normalizedName,
            target: targetNode
        });

        // 4. SAVE TO DATABASE WITH remotePath
        const folder = await Folder.create({
            user: userId,
            name: normalizedName,
            sectionType: normalizedSectionType,
            megaNodeId: newMegaFolder.nodeId,
            parentNodeId: parentId || null,
            remotePath: finalRemotePath // <--- CRITICAL CHANGE
        });

        console.log(`✅ Folder created: ${folder.name} at ${folder.remotePath}`);

        res.status(201).json({
            message: "Folder created successfully",
            folder: {
                _id: folder._id,
                name: folder.name,
                remotePath: folder.remotePath,
                sectionType: folder.sectionType
            }
        });

    } catch (err) {
        console.error("Error creating folder:", err);
        // ... (error handling remains the same)
        res.status(500).json({ message: "Error creating folder", error: err.message });
    }
}

module.exports = { createFolder };