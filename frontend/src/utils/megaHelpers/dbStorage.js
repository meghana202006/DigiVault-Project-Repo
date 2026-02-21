import { openDB } from 'idb';
import { deriveMasterKey } from './genMasterKey';

const DB_NAME = 'DigiVault_Security';
const STORE_NAME = 'keys';
const dbPromise = openDB(DB_NAME, 2 , {
    upgrade(db){
        if(!db.objectStoreNames.contains(STORE_NAME)){
            db.createObjectStore(STORE_NAME);
        }
    }
})

const deriveAndStoreMasterKey = async(userPassword , salt) =>{
   try{
    if(!userPassword || !salt){
        throw new Error('User password and salt are required');
    }
   
    let masterKey;

    try{
        masterKey = await deriveMasterKey(userPassword, salt);
    }catch(error){
        console.error('Error deriving master key:', error);
        throw new Error('Failed to derive master key');
    }
    let db;
    try{
        db = await dbPromise;
    }catch(error){
        console.error('Error opening database:', error);
        throw new Error('Failed to open database');
    }
    try{
        await db.put(STORE_NAME, masterKey, 'master_key');
         console.log('Master key stored successfully');
    }catch(error){
        console.error('Error storing master key:', error);
        throw new Error('Failed to store master key');
    }
    return masterKey;
}catch(error){
    console.error('Error deriving and storing master key:', error);
    throw new Error('Failed to derive and store master key');
}
}

const getMasterKey = async() =>{
    const db = await openDB(DB_NAME, 2);
    const masterKey = await db.get(STORE_NAME, 'master_key');
    if(!masterKey){
        throw new Error('Master key not found');
    }
    return masterKey;
}

export { deriveAndStoreMasterKey, getMasterKey };
