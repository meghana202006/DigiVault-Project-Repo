import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getMasterKey } from '../../utils/megaHelpers/dbStorage';
import { encryptFile } from '../../utils/megaHelpers/fileEncryption';
import { detectFileType } from '../../utils/fileTypeDetection';
import { normalizeSectionType } from '../../utils/sectionTypeHelper';

const UploadFileModal = ({ isOpen, onClose, onUploadSuccess, onUploadStart, sectionType: sectionTypeProp }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState('');

  const fileInputRef = useRef(null);

  const handleFileSelect = (file) => {
    if (!file) return;
    setSelectedFile({
      file,
      name: file.name,
      size: file.size,
      formattedSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      type: file.type
    });
  };

  const handleUpload = async () => {
    if (!selectedFile || isUploading) return;

    setIsUploading(true);
    setUploadStage('Detecting File Type...');
    const uploadId = Date.now();

    try {
      const [fileTypeResult, masterKey] = await Promise.all([
        detectFileType(selectedFile.file, { useMagicNumbers: true }),
        getMasterKey()
      ]);

      // Use section from current view (e.g. Audio/Images) when provided; otherwise auto-detect
      const section = sectionTypeProp
        ? normalizeSectionType(sectionTypeProp)
        : fileTypeResult.section;

      if (!masterKey) {
        alert("Master key missing. Please refresh or log in again.");
        setIsUploading(false);
        return;
      }

      onUploadStart?.({
        id: uploadId,
        name: selectedFile.name,
        size: selectedFile.file.size,
        status: 'uploading',
        progress: 0
      });

      onClose();

      const result = await encryptFile(
        selectedFile.file,
        masterKey,
        section,
        (percent) => {
          const stage = percent >= 100
            ? 'Finishing...'
            : percent < 50
              ? 'Sending to server...'
              : 'Uploading to MEGA...';
          onUploadStart?.({
            id: uploadId,
            progress: percent,
            stage
          });
        },
        selectedFile.name
      );

      if (result.success) {
        setIsUploading(false);
        onUploadSuccess?.(result.file);
        onUploadStart?.({
          id: uploadId,
          name: selectedFile.name,
          size: selectedFile.file.size,
          status: 'success',
          progress: 100
        });
        // Redis was just updated with new file; notify listeners to auto-refresh file lists
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('files:cache-updated'));
        }
      }
    } catch (error) {
      console.error("Upload process failed:", error);
      setIsUploading(false);
      onUploadStart?.({ id: uploadId, name: selectedFile.name, size: selectedFile.file.size, status: 'error', progress: 0 });
      const msg = error.response?.data?.message || error.message;
      const isNetworkError = error.message === 'Network Error' || error?.code === 'ERR_NETWORK';
      alert(isNetworkError
        ? 'Upload failed: connection lost. Check that the server is running and try again.'
        : `Upload failed: ${msg || error.message}`);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-5">
      <div className="max-w-[500px] w-full bg-[#1a2332] p-10 rounded-3xl border border-[#2d3748]">
        <h2 className="text-2xl font-bold text-white mb-6">Upload & Encrypt</h2>

        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className="border-2 border-dashed border-[#3d4a5c] rounded-2xl p-10 text-center cursor-pointer hover:border-[#2dd4bf] transition-all"
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
          />
          <p className="text-[#94a3b8]">{selectedFile ? selectedFile.name : "Select a file to begin"}</p>
        </div>

        <div className="flex gap-4 mt-8">
          <button onClick={onClose} className="flex-1 py-3 bg-[#2d3748] text-white rounded-xl">
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="flex-1 py-3 bg-[#2dd4bf] text-[#0f1419] font-bold rounded-xl disabled:opacity-50"
          >
            {isUploading ? 'Processing...' : 'Upload Now'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default UploadFileModal;
