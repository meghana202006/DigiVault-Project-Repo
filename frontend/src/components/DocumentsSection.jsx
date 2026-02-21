import React from 'react'
import { useState, useRef, useEffect, useCallback } from 'react'
import SectionHeader from './shared/SectionHeader'
import { FileText, X, CheckCircle2 } from 'lucide-react'
import { createPortal } from 'react-dom'
import UploadFileModal from './shared/UploadFileModal'
import CreateFolderModel from './shared/CreateFolderModel'
import FoldersList from './shared/FoldersList'
import FilesList from './shared/FilesList'
import EmptyFolderState from './shared/EmptyFolderState'
import EmptyFileState from './shared/EmptyFileState'
import FolderListSkeleton from './shared/FolderListSkeleton'
import { getFolders, deleteFolder } from '../utils/folderApi'
import { getFiles, deleteFile } from '../utils/fileApi'
import DeleteToast from './shared/DeleteToast'

function DocumentsSection() {
  const [isCreateFolderModelActive, setIsCreateFolderModelActive] = useState(false)
  const [isUploadFileModalActive, setIsUploadFileModalActive] = useState(false)
  const [folders, setFolders] = useState([])
  const [isLoadingFolders, setIsLoadingFolders] = useState(true) // Start with true for instant display
  const [files, setFiles] = useState([])
  const [isLoadingFiles, setIsLoadingFiles] = useState(true) // Start with true for instant display
  const [deletingFolderId, setDeletingFolderId] = useState(null) // Track which folder is being deleted
  const [uploadingFiles, setUploadingFiles] = useState([]) // Track files being uploaded
  const [showUploadNotification, setShowUploadNotification] = useState(false)
  const [successToast, setSuccessToast] = useState(null) // Success toast state
  const [deleteToast, setDeleteToast] = useState(null) // Delete toast state
  const [pendingDelete, setPendingDelete] = useState(null) // Track pending file deletion
  const sectionRef = useRef(null)
  
  // Fetch folders from API
  const fetchFolders = useCallback(async () => {
    setIsLoadingFolders(true);
    
    try {
      console.log('Fetching folders from server...');
      const response = await getFolders('document');
      console.log('Folders API response:', response);
      
      if (response && response.folders) {
        console.log('Setting folders:', response.folders);
        setFolders(response.folders);
      } else {
        console.warn('No folders in response:', response);
        setFolders([]);
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
      console.error('Error details:', error.response?.data || error.message);
      setFolders([]);
    } finally {
      setIsLoadingFolders(false);
    }
  }, []);

  // Fetch files from API
  const fetchFiles = useCallback(async () => {
    setIsLoadingFiles(true);
    
    try {
      console.log('Fetching files from server...');
      const response = await getFiles('document');
      console.log('Files API response:', response);
      
      if (response && response.files) {
        console.log('Setting files:', response.files);
        setFiles(response.files);
      } else {
        console.warn('No files in response:', response);
        setFiles([]);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code
      });
      
      // Only set empty array if it's a real error, not a network timeout that might retry
      if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
        console.warn('Network error or timeout - keeping existing files if any');
        // Don't clear files on network errors, keep what we have
      } else {
        setFiles([]);
      }
    } finally {
      setIsLoadingFiles(false);
    }
  }, []);

  // Fetch folders and files on component mount - set loading immediately
  useEffect(() => {
    setIsLoadingFolders(true);
    setIsLoadingFiles(true);
    fetchFolders();
    fetchFiles();
  }, [fetchFolders, fetchFiles]);

  // Auto-reload file list periodically so it stays in sync (e.g. after changes from another tab or cache updates)
  const FILE_LIST_POLL_INTERVAL_MS = 30000; // 30 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchFiles();
    }, FILE_LIST_POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [fetchFiles]);

  // Auto-refresh when Redis is updated (e.g. after successful upload from any section)
  useEffect(() => {
    const onCacheUpdated = () => fetchFiles();
    window.addEventListener('files:cache-updated', onCacheUpdated);
    return () => window.removeEventListener('files:cache-updated', onCacheUpdated);
  }, [fetchFiles]);

  // Handle folder creation success
  const handleFolderCreated = useCallback((newFolder) => {
    console.log('Folder created, adding to list:', newFolder);
    // Add new folder to the list
    setFolders(prevFolders => [newFolder, ...prevFolders]);
    // Close modal
    setIsCreateFolderModelActive(false);
    // Refresh to ensure consistency
    setTimeout(() => {
      fetchFolders();
    }, 500);
  }, [fetchFolders]);

  // Handle folder click (for future navigation)
  const handleFolderClick = useCallback((folder) => {
    console.log('Folder clicked:', folder);
    // TODO: Navigate to folder or show folder contents
  }, []);

  // Handle folder deletion
  const handleFolderDelete = useCallback(async (folder) => {
    // Confirm deletion
    const confirmed = window.confirm(`Are you sure you want to delete the folder "${folder.name}"?\n\nThis will permanently delete the folder from:\n• Your account\n• Database\n• MEGA storage\n\nThis action cannot be undone.`);
    
    if (!confirmed) {
      return;
    }

    // Set loading state for this specific folder
    setDeletingFolderId(folder._id);

    try {
      // Delete from backend (which deletes from MEGA and DB; backend invalidates file cache)
      await deleteFolder(folder._id);
      await fetchFolders();
      await fetchFiles(); // Reload file list so it reflects cache invalidation
      console.log(`Folder "${folder.name}" deleted successfully from MEGA and database`);
    } catch (error) {
      console.error('Error deleting folder:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete folder. Please try again.';
      alert(`Error: ${errorMessage}`);
    } finally {
      // Clear loading state
      setDeletingFolderId(null);
    }
  }, [fetchFolders, fetchFiles]);

  // Handle folder edit (placeholder for future implementation)
  const handleFolderEdit = useCallback((folder) => {
    console.log('Edit folder:', folder);
    // TODO: Implement folder editing
  }, []);

  // Handle upload start - add to uploading list and close modal
  const handleUploadStart = useCallback((uploadInfo) => {
    console.log('Upload started:', uploadInfo);
    
    // Add to uploading files list
    setUploadingFiles(prev => {
      const exists = prev.find(u => u.id === uploadInfo.id);
      if (exists) {
        // Update existing upload
        return prev.map(u => u.id === uploadInfo.id ? uploadInfo : u);
      }
      // Add new upload
      return [...prev, uploadInfo];
    });
    
    // Show notification
    setShowUploadNotification(true);
    setTimeout(() => setShowUploadNotification(false), 4000);
    
    // Close modal
    setIsUploadFileModalActive(false);
    
    // If upload is complete, show success toast and refresh files list
    if (uploadInfo.status === 'success') {
      // Show success toast
      setSuccessToast({
        fileName: uploadInfo.name,
        message: 'File uploaded successfully!'
      });
      
      // Auto-hide toast after 4 seconds
      setTimeout(() => {
        setSuccessToast(null);
      }, 4000);
      
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(u => u.id !== uploadInfo.id));
        // Refresh files list
        fetchFiles();
      }, 2000);
    } else if (uploadInfo.status === 'error') {
      // Remove from uploading list after showing error
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(u => u.id !== uploadInfo.id));
      }, 5000);
    }
  }, [fetchFiles]);

  // Handle file upload success - remove from uploading list, show toast, refresh files
  const handleUploadSuccess = useCallback((data) => {
    console.log('File uploaded successfully, refreshing files list:', data);
    const fileName = data?.name || 'File';
    setUploadingFiles(prev => prev.filter(u => u.name !== fileName));
    setSuccessToast({
      fileName,
      message: 'File uploaded successfully!'
    });
    setTimeout(() => setSuccessToast(null), 4000);
    // Refetch immediately and again after a short delay so new file appears (avoids cache/timing)
    fetchFiles();
    setTimeout(() => fetchFiles(), 800);
    setTimeout(() => fetchFiles(), 2000);
  }, [fetchFiles]);

  // Handle file deletion
  const handleFileDelete = useCallback((file) => {
    console.log('File delete requested:', file);
    const fileName = file.name || file.originalName || 'File';
    console.log('Setting delete toast with fileName:', fileName);
    // Show delete toast instead of confirmation dialog
    setDeleteToast({
      fileName: fileName,
      fileId: file._id
    });
    // Store pending delete
    setPendingDelete(file);
    console.log('Delete toast state set, pendingDelete set');
  }, []);

  // Confirm file deletion
  const confirmFileDelete = useCallback(async () => {
    if (!pendingDelete) return;

    const fileToDelete = pendingDelete;
    setPendingDelete(null);

    try {
      // Delete from backend (which deletes from MEGA and DB)
      await deleteFile(fileToDelete._id);
      
      // Remove file from the list on success
      //setFiles(prevFiles => prevFiles.filter(f => f._id !== fileToDelete._id));
      await fetchFiles();
      
      console.log(`File "${fileToDelete.name}" deleted successfully from MEGA and database`);
    } catch (error) {
      console.error('Error deleting file:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete file. Please try again.';
      alert(`Error: ${errorMessage}`);
    }
  }, [pendingDelete]);

  // Undo file deletion
  const undoFileDelete = useCallback(() => {
    setPendingDelete(null);
    setDeleteToast(null);
  }, []);
  
  return (
    <div ref={sectionRef} className="relative w-full">
      <SectionHeader 
        icon={FileText} 
        title="Documents" 
        fileCount={files.length} 
        folderCount={folders.length} 
        onNewFolderClick={() => setIsCreateFolderModelActive(true)} 
        onUploadFileClick={() => setIsUploadFileModalActive(true)}
      />
      
        <div className='flex flex-col'>
        {/* Folders Section - Always visible */}
        <h2 className='text-white text-[28px] font-medium mt-2'>Folders Section</h2>
        
        {/* Folders Container */}
        {isLoadingFolders ? (
          <FolderListSkeleton count={3} />
        ) : folders.length > 0 ? (
          <div className='bg-slate-800/30 rounded-lg border border-slate-700/50 mt-6'>
            <FoldersList 
              folders={folders} 
              onFolderClick={handleFolderClick}
              onFolderEdit={handleFolderEdit}
              onFolderDelete={handleFolderDelete}
              deletingFolderId={deletingFolderId}
            />
          </div>
        ) : (
          <EmptyFolderState />
        )}
        
        {/* Files Section - Always visible */}
        <h2 className='text-white text-[28px] font-medium mt-10'>Files Section</h2>
        
        {/* Files Container */}
        {isLoadingFiles ? (
          <FolderListSkeleton count={3} />
        ) : (files.length > 0 || uploadingFiles.length > 0) ? (
          <div className='bg-slate-800/30 rounded-lg border border-slate-700/50 mt-6'>
            <FilesList 
              files={files} 
              uploadingFiles={uploadingFiles}
              onFileDelete={handleFileDelete}
            />
          </div>
        ) : (
          <EmptyFileState />
        )}
      </div>
      
      <CreateFolderModel 
        isActive={isCreateFolderModelActive} 
        onClose={() => setIsCreateFolderModelActive(false)}
        containerRef={sectionRef}
        sectionType="document"
        onFolderCreated={handleFolderCreated}
      />
      <UploadFileModal
        isOpen={isUploadFileModalActive}
        onClose={() => setIsUploadFileModalActive(false)}
        onUploadSuccess={handleUploadSuccess}
        onUploadStart={handleUploadStart}
        containerRef={sectionRef}
      />
      
      {/* Upload Started Notification */}
      {showUploadNotification && (
        <div className="fixed bottom-6 right-6 z-[10000] bg-[#1a2332] border border-[#2dd4bf] rounded-xl p-4 shadow-2xl animate-upload-slideIn max-w-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2dd4bf] rounded-lg flex items-center justify-center flex-shrink-0">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5 text-[#0f1419]">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">Upload Started</p>
              <p className="text-[#94a3b8] text-xs mt-1">File upload is continuing in the background. Check the file list for progress.</p>
            </div>
            <button 
              onClick={() => setShowUploadNotification(false)}
              className="text-[#94a3b8] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Success Toast - Top Centered */}
      {successToast && createPortal(
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[10001] animate-upload-slideIn">
          <div className="bg-[#1a2332] border-2 border-[#48bb78] rounded-xl p-4 shadow-2xl min-w-[320px] max-w-[420px] relative overflow-hidden">
            <div className="flex items-center gap-3">
              <p className="text-white font-medium text-base flex-1 text-center">
                <span className="truncate block" title={successToast.fileName}>
                  {successToast.fileName}
                </span>
                <span className="text-sm text-[#94a3b8]"> uploaded successfully!</span>
              </p>
              <CheckCircle2 className="w-6 h-6 text-[#48bb78] flex-shrink-0" strokeWidth={2.5} />
              <button 
                onClick={() => setSuccessToast(null)}
                className="text-[#94a3b8] hover:text-white transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Toast - Top Centered */}
      {deleteToast && (
        <DeleteToast
          fileName={deleteToast.fileName}
          onConfirm={confirmFileDelete}
          onUndo={undoFileDelete}
          onClose={() => setDeleteToast(null)}
          duration={5000}
        />
      )}
    </div>
  )
}

export default DocumentsSection