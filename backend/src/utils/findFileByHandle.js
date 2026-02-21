const { getStorage } = require('../config/mega');

const findFileByHandle = async (nodes, targetHandle) => {

    for(const node of nodes){
        if(node.handle === targetHandle){
            return node;
        }
        if(node.children){
            const result = findFileByHandle(node.children, targetHandle);
            if(result){
                return result;
            }
        }
    }
    return null;
}
module.exports = findFileByHandle;