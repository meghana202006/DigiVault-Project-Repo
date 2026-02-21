/**
 * Maps frontend section types (singular, lowercase) to backend section types (plural, capitalized)
 * This matches the enum values in the Folder model: ['Documents', 'Images', 'Audio', 'Videos', 'Private']
 */
const sectionTypeMap = {
  'document': 'Documents',
  'documents': 'Documents',
  'image': 'Images',
  'images': 'Images',
  'audio': 'Audio',
  'video': 'Videos',
  'videos': 'Videos',
  'private': 'Private',
  'other': 'Private'
};

/**
 * Normalizes section type to match backend enum values
 * @param {string} sectionType - Section type (can be singular/lowercase or plural/capitalized)
 * @returns {string} Normalized section type matching backend enum
 */
export const normalizeSectionType = (sectionType) => {
  if (!sectionType) return 'Private';
  
  const normalized = sectionType.toLowerCase().trim();
  return sectionTypeMap[normalized] || 'Private';
};

/**
 * Converts backend section type to frontend format (singular, lowercase)
 * @param {string} sectionType - Backend section type (plural, capitalized)
 * @returns {string} Frontend section type (singular, lowercase)
 */
export const toFrontendSectionType = (sectionType) => {
  if (!sectionType) return 'document';
  
  const reverseMap = {
    'Documents': 'document',
    'Images': 'image',
    'Audio': 'audio',
    'Videos': 'video',
    'Private': 'private'
  };
  
  return reverseMap[sectionType] || 'document';
};

