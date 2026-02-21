import React from 'react'
import { useState, useRef, useEffect, useCallback } from 'react'
import SectionHeader from './shared/SectionHeader'
import { Video, X, CheckCircle2 } from 'lucide-react'
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

function VideosSection() {
  const [isCreateFolderModelActive, setIsCreateFolderModelActive] = useState(false)
  const [isUploadFileModalActive, setIsUploadFileModalActive] = useState(false)
  const [folders, setFolders] = useState([])
  const [isLoadingFolders, setIsLoadingFolders] = useState(true)
  const [files, setFiles] = useState([])
  const [isLoadingFiles, setIsLoadingFiles] = useState(true)
  const [deletingFolderId, setDeletingFolderId] = useState(null)
  const [uploadingFiles, setUploadingFiles] = useState([])
  const [showUploadNotification, setShowUploadNotification] = useState(false)
  const [successToast, setSuccessToast] = useState(null)
  const [deleteToast, setDeleteToast] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const sectionRef = useRef(null)

  const fetchFolders = useCallback(async () => {
    setIsLoadingFolders(true)
    try {
      const response = await getFolders('video')
      if (response && response.folders) {
        setFolders(response.folders)
      } else {
        setFolders([])
      }
    } catch (error) {
      console.error('Error fetching video folders:', error)
      setFolders([])
    } finally {
      setIsLoadingFolders(false)
    }
  }, [])

  const fetchFiles = useCallback(async () => {
    setIsLoadingFiles(true)
    try {
      const response = await getFiles('video')
      if (response && response.files) {
        setFiles(response.files)
      } else {
        setFiles([])
      }
    } catch (error) {
      console.error('Error fetching video files:', error)
      if (error.code !== 'ERR_NETWORK' && error.code !== 'ECONNABORTED') {
        setFiles([])
      }
    } finally {
      setIsLoadingFiles(false)
    }
  }, [])

  useEffect(() => {
    setIsLoadingFolders(true)
    setIsLoadingFiles(true)
    fetchFolders()
    fetchFiles()
  }, [fetchFolders, fetchFiles])

  const FILE_LIST_POLL_INTERVAL_MS = 30000
  useEffect(() => {
    const intervalId = setInterval(() => fetchFiles(), FILE_LIST_POLL_INTERVAL_MS)
    return () => clearInterval(intervalId)
  }, [fetchFiles])

  useEffect(() => {
    const onCacheUpdated = () => fetchFiles()
    window.addEventListener('files:cache-updated', onCacheUpdated)
    return () => window.removeEventListener('files:cache-updated', onCacheUpdated)
  }, [fetchFiles])

  const handleFolderCreated = useCallback((newFolder) => {
    setFolders(prev => [newFolder, ...prev])
    setIsCreateFolderModelActive(false)
    setTimeout(() => fetchFolders(), 500)
  }, [fetchFolders])

  const handleFolderClick = useCallback((folder) => {
    console.log('Folder clicked:', folder)
  }, [])

  const handleFolderDelete = useCallback(async (folder) => {
    const confirmed = window.confirm(`Are you sure you want to delete the folder "${folder.name}"?\n\nThis will permanently delete the folder and its contents. This action cannot be undone.`)
    if (!confirmed) return
    setDeletingFolderId(folder._id)
    try {
      await deleteFolder(folder._id)
      await fetchFolders()
      await fetchFiles()
    } catch (error) {
      console.error('Error deleting folder:', error)
      alert(error.response?.data?.message || error.message || 'Failed to delete folder.')
    } finally {
      setDeletingFolderId(null)
    }
  }, [fetchFolders, fetchFiles])

  const handleFolderEdit = useCallback((folder) => {
    console.log('Edit folder:', folder)
  }, [])

  const handleUploadStart = useCallback((uploadInfo) => {
    setUploadingFiles(prev => {
      const exists = prev.find(u => u.id === uploadInfo.id)
      if (exists) return prev.map(u => u.id === uploadInfo.id ? uploadInfo : u)
      return [...prev, uploadInfo]
    })
    setShowUploadNotification(true)
    setTimeout(() => setShowUploadNotification(false), 4000)
    setIsUploadFileModalActive(false)
    if (uploadInfo.status === 'success') {
      setSuccessToast({ fileName: uploadInfo.name, message: 'File uploaded successfully!' })
      setTimeout(() => setSuccessToast(null), 4000)
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(u => u.id !== uploadInfo.id))
        fetchFiles()
      }, 2000)
    } else if (uploadInfo.status === 'error') {
      setTimeout(() => setUploadingFiles(prev => prev.filter(u => u.id !== uploadInfo.id)), 5000)
    }
  }, [fetchFiles])

  const handleUploadSuccess = useCallback((data) => {
    const fileName = data?.name || 'File'
    setUploadingFiles(prev => prev.filter(u => u.name !== fileName))
    setSuccessToast({ fileName, message: 'File uploaded successfully!' })
    setTimeout(() => setSuccessToast(null), 4000)
    setTimeout(() => fetchFiles(), 500)
  }, [fetchFiles])

  const handleFileDelete = useCallback((file) => {
    const fileName = file.name || file.originalName || 'File'
    setDeleteToast({ fileName, fileId: file._id })
    setPendingDelete(file)
  }, [])

  const confirmFileDelete = useCallback(async () => {
    if (!pendingDelete) return
    const fileToDelete = pendingDelete
    setPendingDelete(null)
    try {
      await deleteFile(fileToDelete._id)
      await fetchFiles()
    } catch (error) {
      console.error('Error deleting file:', error)
      alert(error.response?.data?.message || error.message || 'Failed to delete file.')
    }
  }, [pendingDelete])

  const undoFileDelete = useCallback(() => {
    setPendingDelete(null)
    setDeleteToast(null)
  }, [])

  return (
    <div ref={sectionRef} className="relative w-full">
      <SectionHeader
        icon={Video}
        title="Videos"
        fileCount={files.length}
        folderCount={folders.length}
        color="from-emerald-500/80 to-green-500/80"
        onNewFolderClick={() => setIsCreateFolderModelActive(true)}
        onUploadFileClick={() => setIsUploadFileModalActive(true)}
      />

      <div className="flex flex-col">
        <h2 className="text-white text-[28px] font-medium mt-2">Folders</h2>
        {isLoadingFolders ? (
          <FolderListSkeleton count={3} />
        ) : folders.length > 0 ? (
          <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 mt-6">
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

        <h2 className="text-white text-[28px] font-medium mt-10">Videos</h2>
        {isLoadingFiles ? (
          <FolderListSkeleton count={3} />
        ) : files.length > 0 || uploadingFiles.length > 0 ? (
          <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 mt-6">
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
        sectionType="video"
        onFolderCreated={handleFolderCreated}
      />
      <UploadFileModal
        isOpen={isUploadFileModalActive}
        onClose={() => setIsUploadFileModalActive(false)}
        onUploadSuccess={handleUploadSuccess}
        onUploadStart={handleUploadStart}
        containerRef={sectionRef}
      />

      {showUploadNotification && (
        <div className="fixed bottom-6 right-6 z-[10000] bg-[#1a2332] border border-[#2dd4bf] rounded-xl p-4 shadow-2xl animate-upload-slideIn max-w-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2dd4bf] rounded-lg flex items-center justify-center flex-shrink-0">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5 text-[#0f1419]">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">Upload Started</p>
              <p className="text-[#94a3b8] text-xs mt-1">Upload is continuing in the background.</p>
            </div>
            <button onClick={() => setShowUploadNotification(false)} className="text-[#94a3b8] hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {successToast && createPortal(
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[10001] animate-upload-slideIn">
          <div className="bg-[#1a2332] border-2 border-[#48bb78] rounded-xl p-4 shadow-2xl min-w-[320px] max-w-[420px] relative overflow-hidden">
            <div className="flex items-center gap-3">
              <p className="text-white font-medium text-base flex-1 text-center">
                <span className="truncate block" title={successToast.fileName}>{successToast.fileName}</span>
                <span className="text-sm text-[#94a3b8]"> uploaded successfully!</span>
              </p>
              <CheckCircle2 className="w-6 h-6 text-[#48bb78] flex-shrink-0" strokeWidth={2.5} />
              <button onClick={() => setSuccessToast(null)} className="text-[#94a3b8] hover:text-white transition-colors flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

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

export default VideosSection
