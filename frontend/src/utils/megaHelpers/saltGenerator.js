export function generateRandomSalt(){
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return array; // Return Uint8Array directly (not hex string) for crypto operations
}
