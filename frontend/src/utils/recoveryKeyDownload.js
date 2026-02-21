/**
 * Recovery Key Download Utility
 * Handles downloading recovery key file with save location option
 */

/**
 * Converts array of numbers to hex string
 * @param {Array<number>} array - Array of numbers
 * @returns {string} - Hex string
 */
const arrayToHex = (array) => {
    return Array.from(array)
        .map(num => num.toString(16).padStart(2, '0'))
        .join('');
};

/**
 * Converts hex string to array of numbers
 * @param {string} hex - Hex string
 * @returns {Array<number>} - Array of numbers
 */
const hexToArray = (hex) => {
    const result = [];
    for (let i = 0; i < hex.length; i += 2) {
        result.push(parseInt(hex.substr(i, 2), 16));
    }
    return result;
};

/**
 * Generates recovery key file content
 * @param {Object} recoveryData - Recovery key data object
 * @param {string} userEmail - User's email
 * @returns {string} - Formatted file content
 */
export const generateRecoveryKeyFile = (recoveryData, userEmail) => {
    const timestamp = new Date().toISOString();
    const formattedDate = new Date(timestamp).toLocaleString();
    
    const fileContent = `========================================
DigiVault Recovery Key
========================================

Account Email: ${userEmail}
Generated: ${formattedDate}

IMPORTANT: Keep this file secure!
This recovery key is required to recover your encrypted files.

========================================
Recovery Key Data:
========================================

Salt: ${arrayToHex(recoveryData.salt)}
Recovery Vault: ${arrayToHex(recoveryData.recoveryVault)}
Vault IV: ${arrayToHex(recoveryData.vaultIv)}

========================================
Security Instructions:
========================================

1. Store this file in a secure location
2. Do not share this file with anyone
3. Keep a backup in a safe place
4. If you lose this key, you cannot recover your files

========================================
File Format: JSON
========================================

${JSON.stringify(recoveryData, null, 2)}

========================================
End of Recovery Key
========================================`;

    return fileContent;
};

/**
 * Downloads a file using File System Access API (if supported) or fallback to regular download
 * @param {string} content - File content
 * @param {string} filename - File name
 * @param {string} mimeType - MIME type (default: text/plain)
 * @returns {Promise<boolean>} - Returns true if download was successful
 */
export const downloadFileWithSaveDialog = async (content, filename, mimeType = 'text/plain') => {
    try {
        // Check if File System Access API is supported (Chrome, Edge)
        if ('showSaveFilePicker' in window) {
            try {
                const fileHandle = await window.showSaveFilePicker({
                    suggestedName: filename,
                    types: [{
                        description: 'Text file',
                        accept: { 'text/plain': ['.txt'] }
                    }]
                });

                const writable = await fileHandle.createWritable();
                await writable.write(content);
                await writable.close();
                
                return true;
            } catch (err) {
                // User cancelled the save dialog
                if (err.name === 'AbortError') {
                    return false;
                }
                // Fallback to regular download if File System API fails
                console.warn('File System Access API failed, using fallback:', err);
            }
        }

        // Fallback: Regular download (triggers browser's save dialog)
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
        
        return true;
    } catch (error) {
        console.error('Download error:', error);
        return false;
    }
};

/**
 * Downloads recovery key file
 * @param {Object} recoveryData - Recovery key data
 * @param {string} userEmail - User's email
 * @returns {Promise<boolean>} - Returns true if download was successful
 */
export const downloadRecoveryKey = async (recoveryData, userEmail) => {
    const fileContent = generateRecoveryKeyFile(recoveryData, userEmail);
    const filename = `DigiVault_RecoveryKey_${userEmail.replace('@', '_at_')}_${Date.now()}.txt`;
    
    return await downloadFileWithSaveDialog(fileContent, filename, 'text/plain');
};


