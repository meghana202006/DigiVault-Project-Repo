import React, { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import ModalContainer from './ModalContainer'
import { FolderPlus, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { MdCreateNewFolder } from 'react-icons/md'
import { createFolder } from '../../utils/folderApi'
import { normalizeSectionType } from '../../utils/sectionTypeHelper'
import useFolderNameAvailability from '../hooks/useFolderNameAvailability'

function CreateFolderModel({ isActive, onClose, containerRef, sectionType = 'document', onFolderCreated }) {
  const [folderName, setFolderName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Use the custom hook for folder name availability checking
  const {
    status: folderNameStatus,
    checkFolderName,
    resetStatus: resetFolderNameStatus
  } = useFolderNameAvailability(sectionType, 100);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isActive) {
      // Find the scrollable container (the div with overflow-y-auto in VaultLayout)
      const scrollableContainer = document.querySelector('.overflow-y-auto');
      
      let savedScrollPosition = 0;
      
      if (scrollableContainer) {
        // Save current scroll position of the container
        savedScrollPosition = scrollableContainer.scrollTop;
        // Lock container scroll
        scrollableContainer.style.overflow = 'hidden';
      } else {
        // Fallback: lock body scroll if container not found
        savedScrollPosition = window.scrollY || document.documentElement.scrollTop;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${savedScrollPosition}px`;
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
      }

      return () => {
        // Restore scroll when modal closes
        if (scrollableContainer) {
          scrollableContainer.style.overflow = '';
          scrollableContainer.scrollTop = savedScrollPosition;
        } else {
          // Restore body scroll
          document.body.style.position = '';
          document.body.style.top = '';
          document.body.style.width = '';
          document.body.style.overflow = '';
          document.documentElement.style.overflow = '';
          window.scrollTo(0, savedScrollPosition);
        }
      };
    }
  }, [isActive]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isActive) {
      setFolderName('');
      setError('');
      resetFolderNameStatus();
    }
  }, [isActive, resetFolderNameStatus]);

  if (!isActive) return null;

  const handleClose = () => {
    if (!isLoading && onClose) {
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!folderName.trim()) {
      setError('Folder name is required');
      return;
    }

    // If folder name is not available or still checking, don't submit
    if (folderNameStatus.available === false || folderNameStatus.checking) {
      if (folderNameStatus.checking) {
        setError('Please wait while we check the folder name');
      } else {
        setError('A folder with this name already exists in this section');
      }
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Normalize section type to match backend enum (Documents, Images, Audio, Videos, Private)
      const normalizedSectionType = normalizeSectionType(sectionType);
      
      const response = await createFolder(folderName.trim(), normalizedSectionType);
      
      if (response && response.folder) {
        // Call callback to refresh folder list
        if (onFolderCreated) {
          onFolderCreated(response.folder);
        }
        // Close modal
        handleClose();
      }
    } catch (err) {
      console.error('Error creating folder:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create folder. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Use React Portal to render at document.body level for full page coverage
  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm"
    >
      <div className="p-4 w-full flex items-center justify-center">
        <ModalContainer onClose={handleClose} maxWidth="xl" padding="lg" maxHeight='2xl'>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col">
            <span className="flex items-center gap-3">
            <MdCreateNewFolder className="w-12 h-12 text-amber-400" />
            <h2 className="text-3xl font-bold text-white mb-2">Create New Folder</h2>
            </span>
            
            <p className="text-slate-400"></p>
          </div>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <label className="text-slate-300 text-lg">Enter a name for your new folder</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Folder name"
                value={folderName}
                onChange={(e) => {
                  const value = e.target.value;
                  setFolderName(value);
                  setError('');
                  // Check folder name availability directly in onChange (like Register component)
                  checkFolderName(value);
                }}
                disabled={isLoading}
                className={`w-full px-4 py-3 pr-12 bg-slate-700/50 border h-13 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all placeholder:text-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                  folderNameStatus.available === false 
                    ? 'border-red-400 focus:border-red-400 focus:ring-red-400' 
                    : folderNameStatus.available === true 
                    ? 'border-green-400 focus:border-green-400 focus:ring-green-400' 
                    : 'border-slate-600 focus:ring-cyan-500 focus:border-transparent'
                }`}
                autoFocus
              />
              {/* Status Icon */}
              {folderName.trim().length >= 1 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {folderNameStatus.checking ? (
                    <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                  ) : folderNameStatus.available === true ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : folderNameStatus.available === false ? (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  ) : null}
                </div>
              )}
            </div>
            
            {/* Status message */}
            {folderName.trim().length >= 1 && folderNameStatus.message && (
              <div className={`text-base mt-1 flex items-center gap-2 ${
                folderNameStatus.available === true 
                  ? 'text-green-400' 
                  : folderNameStatus.available === false 
                  ? 'text-red-400' 
                  : 'text-slate-400'
              }`}>
                {folderNameStatus.checking ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{folderNameStatus.message || 'Checking folder name...'}</span>
                  </>
                ) : (
                  <>
                    {folderNameStatus.available === true && <CheckCircle className="w-5 h-5" />}
                    {folderNameStatus.available === false && <AlertCircle className="w-5 h-5" />}
                    <span>{folderNameStatus.message}</span>
                  </>
                )}
              </div>
            )}
            
            {/* Error message */}
            {error && (
              <div className="text-red-400 text-base mt-1">
                {error}
              </div>
            )}
            
            <div className="flex gap-3 justify-center mt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium text-lg rounded-lg transition-colors w-full h-12 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !folderName.trim() || folderNameStatus.available === false}
                className="px-6 py-2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-400 text-slate-900 text-lg font-medium rounded-lg transition-all w-full h-12 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </ModalContainer>
      </div>
    </div>,
    document.body
  )
}

export default CreateFolderModel