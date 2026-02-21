function findFolderByNodeId(storage, targetNodeId){
    function searchFolder(node){
        if(node.nodeId === targetNodeId){
            return node;
        }
        if(node.children){
            for(const child of node.children){
                const result = searchFolder(child);
                if(result){
                    return result;
                }
            }
        }
        return null;
    }
    return searchFolder(storage.root);
}

module.exports = { findFolderByNodeId };