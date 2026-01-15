const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';

// Helper to get the correct 32-byte key buffer
const getBufferKey = (secret) => {
    return crypto.createHash('sha256').update(secret).digest();
};

// 1. SERVER SIDE ENCRYPTION (Protecting the User's Passkey)
exports.encryptPasskey = (passkey) => {
    const key = getBufferKey(process.env.SERVER_SECRET);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(passkey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
};

exports.decryptPasskey = (encryptedPasskey) => {
    const key = getBufferKey(process.env.SERVER_SECRET);
    const parts = encryptedPasskey.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = parts.join(':');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
};


// 2. USER SIDE ENCRYPTION

exports.encryptFileLink = (link, userPasskey) => {
    const key = getBufferKey(userPasskey);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(link, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
};

// 3 USER SIDE ENCRYPTION
exports.decryptFileLink = (encryptedLink, userPasskey) => {
    const key = getBufferKey(userPasskey);
    const parts = encryptedLink.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = parts.join(':');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
};