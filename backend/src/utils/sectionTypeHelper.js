/**
 * Maps various section type formats to the standard enum values
 * Enum values: ['Documents', 'Images', 'Audio', 'Videos', 'Private']
 */
const sectionTypeMap = {
  // Singular, lowercase
  'document': 'Documents',
  'image': 'Images',
  'audio': 'Audio',
  'video': 'Videos',
  'private': 'Private',
  'other': 'Private',
  // Plural, lowercase
  'documents': 'Documents',
  'images': 'Images',
  'videos': 'Videos',
  // Already normalized
  'Documents': 'Documents',
  'Images': 'Images',
  'Audio': 'Audio',
  'Videos': 'Videos',
  'Private': 'Private'
};

/**
 * Normalizes section type to match the Folder model enum
 * @param {string} sectionType - Section type in any format
 * @returns {string} Normalized section type matching enum: ['Documents', 'Images', 'Audio', 'Videos', 'Private']
 * @throws {Error} If sectionType is missing or invalid
 */
const normalizeSectionType = (sectionType) => {
  if (!sectionType || typeof sectionType !== 'string') {
    throw new Error('Section type is required and must be a string');
  }
  
  const normalized = sectionType.trim();
  if (!normalized) {
    throw new Error('Section type cannot be empty');
  }
  
  const result = sectionTypeMap[normalized] || sectionTypeMap[normalized.toLowerCase()];
  if (!result) {
    throw new Error(`Invalid section type: "${sectionType}". Valid types are: Documents, Images, Audio, Videos, Private`);
  }
  
  return result;
};

module.exports = { normalizeSectionType };

