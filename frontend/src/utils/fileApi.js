import axiosInstance from './axiosInstance';

/**
 * Get files for a specific section
 * Files are filtered by fileType which maps to section types:
 * - document -> fileType: 'document'
 * - image -> fileType: 'image'
 * - audio -> fileType: 'audio'
 * - video -> fileType: 'video'
 * - private -> fileType: 'private'
 * @param {string} sectionType - Section type (document, image, audio, video, private)
 * @returns {Promise} API response with files array
 */
export const getFiles = async (sectionType) => {
  try {
    console.log('Fetching files for sectionType:', sectionType);
    
    // Get all files from dashboard endpoint (cache-bust so refetch after upload gets fresh data)
    const response = await axiosInstance.get('/files/dashboard', {
      params: { _: Date.now() },
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' }
    });
    
    if (response.data && response.data.files) {
      // Map sectionType to fileType (they use the same values)
      const fileType = sectionType.toLowerCase();
      
      // Filter files by fileType; backend already returns newest first (createdAt: -1)
      const filteredFiles = response.data.files.filter(file => 
        file.fileType === fileType
      );
      
      console.log(`Found ${filteredFiles.length} files for sectionType: ${sectionType} (fileType: ${fileType})`);
      return {
        message: "Files retrieved successfully",
        files: filteredFiles
      };
    }
    
    // If response exists but no files array, return empty
    if (response.data) {
      console.warn('Response received but no files array:', response.data);
      return {
        message: response.data.message || "Files retrieved successfully",
        files: []
      };
    }
    
    return {
      message: "Files retrieved successfully",
      files: []
    };
  } catch (error) {
    console.error('Error fetching files:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      code: error.code
    });
    
    // Re-throw the error so the caller can handle it
    throw error;
  }
};

/**
 * Delete a file
 * @param {string} fileId - ID of the file to delete
 * @returns {Promise} API response
 */
export const deleteFile = async (fileId) => {
  try {
    const response = await axiosInstance.delete(`/files/${fileId}`);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('files:cache-updated'));
    }
    return response.data;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

/**
 * Get recent files from Redis sorted sets (auto-trimmed to 10 most recent).
 * @param {Object} options - Query options
 * @param {string} options.section - Filter by section type (document, image, audio, video, private)
 * @param {number} options.limit - Number of files to return (default 10, max 20)
 * @returns {Promise} API response with files array
 */
export const getRecentFiles = async ({ section = null, limit = 10 } = {}) => {
  try {
    const params = { limit };
    if (section) params.section = section;
    
    const response = await axiosInstance.get('/files/recent', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching recent files:', error);
    throw error;
  }
};

/**
 * Get section-specific recent files from Redis sorted sets.
 * @param {string} sectionType - Section type (document, image, audio, video, private)
 * @param {number} limit - Number of files to return (default 10)
 * @returns {Promise} API response with files array
 */
export const getSectionRecentFiles = async (sectionType, limit = 10) => {
  return getRecentFiles({ section: sectionType, limit });
};
