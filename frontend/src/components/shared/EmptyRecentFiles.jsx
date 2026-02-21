import React, { memo, useState } from 'react';
import UploadFileModal from './UploadFileModal';

const EmptyRecentFiles = memo(({ onUploadSuccess }) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isIconClicked, setIsIconClicked] = useState(false);

  const handleOpenModal = () => {
    console.log('Opening upload modal');
    setIsIconClicked(true);
    // Open modal immediately, then reset icon animation
    setIsUploadModalOpen(true);
    setTimeout(() => {
      setIsIconClicked(false);
    }, 300);
  };

  const handleCloseModal = () => {
    setIsUploadModalOpen(false);
  };

  const handleUploadSuccess = (data) => {
    console.log('File uploaded successfully from EmptyRecentFiles', data);
    if (onUploadSuccess) {
      onUploadSuccess(data);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center py-16 px-5 rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-2 border-dashed border-cyan-400/80 w-full">
        {/* Visual Indicator - Cloud Upload Icon */}
        <div className={`mb-5 transition-transform duration-300 ${isIconClicked ? '-translate-y-4' : ''}`}>
          <button
            onClick={handleOpenModal}
            className="group cursor-pointer focus:outline-none"
            aria-label="Upload file"
          >
            <svg 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              className="w-20 h-20 text-teal-400 group-hover:text-teal-300 transition-colors duration-200"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </button>
        </div>

        {/* Messaging */}
        <div className='flex flex-col items-center justify-center mt-3'>
          <h3 className="text-white text-[20px] font-medium mb-2">
            No files uploaded yet
          </h3>
          <p className="text-slate-400 text-[20px] max-w-[300px] text-center mb-5">
            Once you upload files, they will appear here for quick access.
          </p>

          {/* The Action */}
          <button 
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium text-xl hover:from-cyan-600 hover:to-blue-600 transition-all" 
            onClick={handleOpenModal}
          >
            Upload your first file
          </button>
        </div>
      </div>

      <UploadFileModal
        isOpen={isUploadModalOpen}
        onClose={handleCloseModal}
        onUploadSuccess={handleUploadSuccess}
      />
    </>
  );
});

export default EmptyRecentFiles;
