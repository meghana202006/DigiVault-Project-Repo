/**
 * CONSTANTS - Defined outside functions to prevent 
 * re-allocation on every execution.
 */
const SECTIONS = {
    IMAGES: { type: 'image', section: 'Images' },
    VIDEOS: { type: 'video', section: 'Videos' },
    AUDIO: { type: 'audio', section: 'Audio' },
    DOCS: { type: 'document', section: 'Documents' },
    OTHER: { type: 'other', section: 'Private' }
  };
  
  const EXT_MAP = {
    images: new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico', 'tiff', 'tif', 'heic', 'heif']),
    videos: new Set(['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv', 'm4v', '3gp', 'ogv', 'ts', 'mpeg', 'mpg']),
    audio: new Set(['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'opus', 'amr', '3ga']),
    docs: new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'odt', 'ods', 'odp', 'csv', 'md', 'json', 'xml', 'html', 'css'])
  };
  
  /**
   * Optimized Magic Number Detection
   * Uses direct byte comparison instead of string parsing.
   */
  const detectFromMagicNumbers = async (file) => {
    try {
      const buffer = await file.slice(0, 16).arrayBuffer();
      const bytes = new Uint8Array(buffer);
  
      // JPEG: FF D8 FF
      if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return SECTIONS.IMAGES;
  
      // PNG: 89 50 4E 47
      if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return SECTIONS.IMAGES;
  
      // GIF: GIF8 (47 49 46 38)
      if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return SECTIONS.IMAGES;
  
      // PDF: %PDF (25 50 44 46)
      if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return SECTIONS.DOCS;
  
      // ZIP/Office: PK.. (50 4B 03 04)
      if (bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04) return SECTIONS.DOCS;
  
      // MP4: ftyp (checks bytes 4-7)
      if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) return SECTIONS.VIDEOS;
  
      return null;
    } catch (e) {
      return null;
    }
  };
  
  /**
   * Tiered Detection Logic - Optimized for speed
   */
  export const detectFileType = async (file, options = { useMagicNumbers: true }) => {
    if (!file) return { ...SECTIONS.OTHER, method: 'default' };

    // 1. Extension (Fastest - no async needed)
    const ext = file.name ? file.name.split('.').pop().toLowerCase() : "";
    if (EXT_MAP.images.has(ext)) return { ...SECTIONS.IMAGES, method: 'extension' };
    if (EXT_MAP.videos.has(ext)) return { ...SECTIONS.VIDEOS, method: 'extension' };
    if (EXT_MAP.audio.has(ext)) return { ...SECTIONS.AUDIO, method: 'extension' };
    if (EXT_MAP.docs.has(ext)) return { ...SECTIONS.DOCS, method: 'extension' };

    // 2. MIME (Fast, synchronous)
    const mime = (file.type || "").toLowerCase();
    if (mime.startsWith('image/')) return { ...SECTIONS.IMAGES, method: 'mime' };
    if (mime.startsWith('video/')) return { ...SECTIONS.VIDEOS, method: 'mime' };
    if (mime.startsWith('audio/')) return { ...SECTIONS.AUDIO, method: 'mime' };
    if (mime.includes('pdf') || mime.includes('office') || mime.includes('word') || mime.startsWith('text/')) {
      return { ...SECTIONS.DOCS, method: 'mime' };
    }

    // 3. Magic Numbers (Only if needed - slowest)
    if (options.useMagicNumbers && (file instanceof Blob)) {
      const magic = await detectFromMagicNumbers(file);
      if (magic) return { ...magic, method: 'magic' };
    }

    return { ...SECTIONS.OTHER, method: 'default' };
  };