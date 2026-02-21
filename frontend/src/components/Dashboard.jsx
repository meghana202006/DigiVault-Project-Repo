import React, { useState, useCallback, useEffect } from 'react'
import folderImage from '../assets/folder_image.png'
import { ShieldCheck, LayoutDashboard , FileText, Image, Music, Video, Lock ,Trash2 , HardDrive, Clock, CheckCircle2, X} from 'lucide-react'
import { createPortal } from 'react-dom'
import useUser from './hooks/useUser';
import StorageDisplay from './shared/StorageDisplay';
import UploadFileModal from './shared/UploadFileModal';
import RecentFiles from './shared/RecentFiles';
import NavigationPanel from './NavigationPanel';
import VaultHeader from './shared/VaultHeader';
import SearchBar from './shared/SearchBar';
import DiskStorageDisplay from './shared/DiskStorageDisplay';
import axiosInstance from '../utils/axiosInstance';


// Move outside component to prevent recreation on every render
const storageItems = [
  {id:1 , icon:FileText, section:'Documents',storage:100 , color:'from-blue-500 to-cyan-500',borderStart:'#3b82f6',borderEnd:'#22d3ee'},
  {id:2 , icon:Image, section:'Images',storage:100 , color:'from-rose-500 to-pink-500',borderStart:'#f43f5e',borderEnd:'#ec4899'},
  {id:3 , icon:Music, section:'Audio',storage:100 , color:'from-indigo-500 to-purple-500',borderStart:'#8b5cf6',borderEnd:'#a855f7'},
  {id:4 , icon:Video, section:'Videos',storage:100 , color:'from-emerald-500 to-green-500',borderStart:'#22c55e',borderEnd:'#16a34a'},
  {id:5 , icon:Lock, section:'Private',storage:100 , color:'from-amber-500 to-yellow-400',borderStart:'#f59e0b',borderEnd:'#facc15'},
  {id:6 , icon:Trash2, section:'Trash',storage:100 , color:'from-red-500 to-red-600',borderStart:'#ef4444',borderEnd:'#dc2626'},
  
]




function Dashboard() {
  const { user, loading } = useUser();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState(null);
  const [recentFilesRefreshTrigger, setRecentFilesRefreshTrigger] = useState(0);
  const [activeSection , setActiveSection] = useState('Dashboard');
  const [storageData, setStorageData] = useState({
    Documents: { storage: 0, lastUpdated: null },
    Images: { storage: 0, lastUpdated: null },
    Audio: { storage: 0, lastUpdated: null },
    Videos: { storage: 0, lastUpdated: null },
    Private: { storage: 0, lastUpdated: null },
    Trash: { storage: 0, lastUpdated: null }
  });

  // Calculate storage and last update date from files
  const calculateStorage = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/files/dashboard');
      
      if (response.data && response.data.files) {
        const files = response.data.files;
        
        // Initialize storage data
        const newStorageData = {
          Documents: { storage: 0, lastUpdated: null },
          Images: { storage: 0, lastUpdated: null },
          Audio: { storage: 0, lastUpdated: null },
          Videos: { storage: 0, lastUpdated: null },
          Private: { storage: 0, lastUpdated: null },
          Trash: { storage: 0, lastUpdated: null }
        };
        
        // Map fileType to section name
        const fileTypeToSection = {
          'document': 'Documents',
          'image': 'Images',
          'audio': 'Audio',
          'video': 'Videos',
          'private': 'Private'
        };
        
        // Calculate storage and find last update date for each section
        let documentsCount = 0;
        let documentsTotalSize = 0;
        
        files.forEach(file => {
          const section = fileTypeToSection[file.fileType] || 'Private';
          
          if (newStorageData[section]) {
            // Add file size (convert bytes to GB)
            const fileSizeGB = (file.size || 0) / (1024 * 1024 * 1024);
            newStorageData[section].storage += fileSizeGB;
            
            // Track Documents section specifically
            if (section === 'Documents') {
              documentsCount++;
              documentsTotalSize += file.size || 0;
            }
            
            // Update last updated date if this file is more recent
            if (file.createdAt) {
              const fileDate = new Date(file.createdAt);
              if (!newStorageData[section].lastUpdated || fileDate > new Date(newStorageData[section].lastUpdated)) {
                newStorageData[section].lastUpdated = file.createdAt;
              }
            }
          }
        });
        
        // Round storage to 2 decimal places
        Object.keys(newStorageData).forEach(section => {
          newStorageData[section].storage = Math.round(newStorageData[section].storage * 100) / 100;
        });
        
        setStorageData(newStorageData);
        console.log('Storage calculated:', newStorageData);
        console.log(`Documents section: ${documentsCount} files, ${(documentsTotalSize / (1024 * 1024 * 1024)).toFixed(2)} GB total`);
      }
    } catch (error) {
      console.error('Error calculating storage:', error);
      // Log detailed error information
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Request made but no response received:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up request:', error.message);
      }
      console.error('Error config:', error.config);
    }
  }, []);
  
  const handleUploadSuccess = useCallback((data) => {
    console.log('Upload successful:', data);
    setSuccessToast({ fileName: data?.name || 'File' });
    setTimeout(() => setSuccessToast(null), 4000);
    calculateStorage();
    setRecentFilesRefreshTrigger((t) => t + 1);
  }, [calculateStorage]);

  const handleSetActiveSection = useCallback((section) => {
    setActiveSection(section);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsUploadModalOpen(false);
  }, []);

  const handleOpenModal = useCallback(() => {
    setIsUploadModalOpen(true);
  }, []);
  
  // Fetch storage data on mount and when upload succeeds
  useEffect(() => {
    calculateStorage();
  }, [calculateStorage]);
  
  return (
    <>
             <main>
              <div className='container mx-auto px-5 py-10'>
                <DiskStorageDisplay />
              </div>
                
                <h2 className='text-white text-3xl font-bold px-5'>Storage Overview</h2>

                <div className='grid grid-cols-3 gap-8 mt-5 px-5'>
                  {storageItems.map((item) => {
                    const sectionData = storageData[item.section] || { storage: 0, lastUpdated: null };
                    return (
                      <StorageDisplay 
                        key={item.id} 
                        storage={sectionData.storage} 
                        lastUpdated={sectionData.lastUpdated}
                        icon={item.icon} 
                        section={item.section} 
                        color={item.color}
                        borderStart={item.borderStart}
                        borderEnd={item.borderEnd}
                      />
                    );
                  })}
                </div>
                
                {/* Recent Files Section */}
                <div className='flex flex-col mt-10 px-5'>
                  <div className='flex items-center gap-4 mt-2'>
                    <Clock className='w-8 h-8 text-cyan-500'/>
                    <h2 className='text-white text-[28px] font-medium'>Recent Files</h2>
                  </div>
                  
                  {/* Files Container */}
                  <div className='mt-5'>
                    <RecentFiles onUploadSuccessWithData={handleUploadSuccess} refreshTrigger={recentFilesRefreshTrigger} />
                  </div>
                </div>
                 
                <div className='h-32'></div>
              
            </main>
            <UploadFileModal
        isOpen={isUploadModalOpen}
        onClose={handleCloseModal}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Success Toast - when upload completes from Dashboard/Recent Files */}
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
          </>
    )
}

export default Dashboard;
