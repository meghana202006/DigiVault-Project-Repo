const { Storage } = require('megajs');

let storage;

const connectToMega = async () => {
    return new Promise((resolve, reject) => {
        storage = new Storage({
            email: process.env.MEGA_EMAIL,
            password: process.env.MEGA_PASSWORD
        });

        storage.on('ready', () => {
            console.log('Connected to MEGA Storage!');
            resolve(storage);
        });

        storage.on('error', (err) => {
            console.error('MEGA Connection Error:', err);
            reject(err);
        });
    });
};

const getStorage = () => {
    if (!storage) {
        throw new Error("MEGA storage not initialized! Check your connection.");
    }
    return storage;
};

module.exports = { connectToMega, getStorage };