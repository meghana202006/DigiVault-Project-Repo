export async function deriveMasterKey(userPassword, salt){
    const encoder = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
        "raw",
        encoder.encode(userPassword),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );
    return await crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256"
        },
        baseKey,
        { name: "AES-GCM" , length: 256 },
        false,
        ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
    );
}