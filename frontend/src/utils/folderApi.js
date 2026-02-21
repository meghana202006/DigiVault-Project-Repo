import axiosInstance from './axiosInstance';
import { normalizeSectionType } from './sectionTypeHelper';

/**
 * Create a new folder
 * @param {string} folderName - Name of the folder
 * @param {string} sectionType - Section type (document, image, audio, video, private)
 * @returns {Promise} API response
 */
export const createFolder = async (folderName, sectionType) => {
  try {
    const response = await axiosInstance.post('/files/create-folder', {
      name: folderName,
      sectionType: sectionType
    });
    return response.data;
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
};

/**
 * Get folders for a specific section
 * @param {string} sectionType - Section type (document, image, audio, video, private)
 * @returns {Promise} API response with folders array
 */
export const getFolders = async (sectionType) => {
  try {
    console.log('Fetching folders for sectionType:', sectionType);
    const response = await axiosInstance.get('/files/folders', {
      params: {
        sectionType: sectionType
      }
    });
    console.log('getFolders API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching folders:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

/**
 * Check if a folder name already exists in a section
 * @param {string} folderName - Name of the folder to check
 * @param {string} sectionType - Section type (document, image, audio, video, private)
 * @param {object} config - Optional axios config (for abort signal, etc.)
 * @returns {Promise} API response with exists boolean and message
 */
export const checkFolderExists = async (folderName, sectionType, config = {}) => {
  try {
    // Capitalize first letter to match backend enum
    const normalizedSectionType = sectionType.charAt(0).toUpperCase() + sectionType.slice(1);
    
    const response = await axiosInstance.get('/files/check-folder', {
      params: {
        name: folderName,
        sectionType: normalizedSectionType
      },
      ...config
    });
    return response.data;
  } catch (error) {
    // Don't throw for abort errors
    if (error.name === 'AbortError' || error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
      throw error;
    }
    console.error('Error checking folder existence:', error);
    throw error;
  }
};

/**
 * Check if a folder name is available (matches pattern used by useEmailAvailability)
 * @param {string} folderName - Name of the folder to check
 * @param {string} sectionType - Section type (document, image, audio, video, private)
 * @param {object} config - Optional axios config (for abort signal, etc.)
 * @returns {Promise<{available: boolean|null, message: string, error: boolean}>}
 */
export const checkFolderNameAvailability = async (folderName, sectionType, config = {}) => {
  // Return early if folder name is empty
  if (!folderName || folderName.trim() === '') {
    return {
      available: null,
      message: '',
      error: false
    };
  }

  try {
    // Normalize section type to match backend enum
    const normalizedSectionType = normalizeSectionType(sectionType);
    
    const response = await axiosInstance.get('/files/check-folder', {
      params: {
        name: folderName.trim(),
        sectionType: normalizedSectionType
      },
      ...config // Include abort signal and other config
    });
    
    // Convert exists to available (exists = false means available = true)
    return {
      available: !response.data.exists,
      message: response.data.message || (response.data.exists ? 'A folder with this name already exists in this section' : 'Folder name is available'),
      error: false
    };
  } catch (err) {
    // Don't throw for abort errors - let the hook handle them
    if (err.name === 'AbortError' || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
      throw err;
    }
    console.error('Error checking folder name:', err);
    return {
      available: false,
      message: err.response?.data?.message || 'Error checking folder name',
      error: true
    };
  }
};

/**
 * Delete a folder
 * @param {string} folderId - ID of the folder to delete
 * @returns {Promise} API response
 */
export const deleteFolder = async (folderId) => {
  try {
    const response = await axiosInstance.delete(`/files/folder/${folderId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting folder:', error);
    throw error;
  }
};

