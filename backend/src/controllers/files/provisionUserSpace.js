const { v4 : uuidv4 } = require('uuid');
const { Storage } = require('megajs')

async function provisionUserSpace(){
    try {
        console.log("Starting MEGA space provisioning...");
        
        // Generate a unique id for each user
        const userInternalId = uuidv4();
        console.log("Generated UUID:", userInternalId);

        console.log("Connecting to MEGA storage...");
        const storage = await new Storage({
            email :process.env.MEGA_EMAIL,
            password :process.env.MEGA_PASSWORD,
        }).ready;
        console.log("MEGA storage connected successfully");

        const rootFolder = `u_${userInternalId}`;
        console.log("Creating root folder:", rootFolder);
        const userRoot = await storage.mkdir(rootFolder);
        console.log("Root folder created with nodeId:", userRoot.nodeId);

        //3. Create default sections in the root folder 
        const sections = ['Documents', 'Images', 'Audio', 'Videos', 'Private'];
        const folderMappings = {};

        console.log("Creating default sections...");
        for(const section of sections){
            const folder = await storage.mkdir({
                name:section,
                target:userRoot
            })
            folderMappings[section] = folder.nodeId;
            console.log(`Created section '${section}' with nodeId:`, folder.nodeId);
        }
        
        const result = {
            uuid:userInternalId,
            rootNodeId:userRoot.nodeId,
            sectionNodeIds:folderMappings,
        };
        
        console.log("MEGA space provisioning completed successfully");
        return result;
    } catch (error) {
        console.error("Error in provisionUserSpace:", error);
        throw error;
    }
}

module.exports = {provisionUserSpace};