import React from 'react'
import { Upload, FolderPlus } from 'lucide-react'

function DiskStorageDisplay() {
  const handleUploadFiles = () => {
    console.log('Upload Files clicked');
  };

  const handleNewFolder = () => {
    console.log('New Folder clicked');
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br 
                    from-blue-500 via-purple-500 to-purple-600 
                    rounded-3xl p-10 shadow-2xl min-h-[280px]">
      {/* Curved gradient shapes - multiple layers for depth */}
      {/* Top-right large curved shape - main highlight */}
      <div 
        className="absolute -top-32 -right-32 w-96 h-96 
                   rounded-full blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.3) 25%, rgba(147, 51, 234, 0.2) 45%, transparent 70%)',
        }}
      ></div>
      
      {/* Middle-right curved shape */}
      <div 
        className="absolute top-1/2 -right-24 w-80 h-80 
                   rounded-full blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, rgba(147, 51, 234, 0.3) 35%, rgba(59, 130, 246, 0.25) 55%, transparent 75%)',
        }}
      ></div>
      
      {/* Bottom-left curved shape */}
      <div 
        className="absolute -bottom-24 -left-24 w-72 h-72 
                   rounded-full blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, rgba(147, 51, 234, 0.3) 35%, rgba(255, 255, 255, 0.2) 55%, transparent 75%)',
        }}
      ></div>
      
      {/* Top-left lighter curved shape */}
      <div 
        className="absolute -top-16 -left-16 w-64 h-64 
                   rounded-full blur-2xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.35) 0%, rgba(147, 51, 234, 0.25) 40%, transparent 70%)',
        }}
      ></div>
      
      {/* Center curved accent */}
      <div 
        className="absolute top-1/3 left-1/4 w-56 h-56 
                   rounded-full blur-2xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, rgba(59, 130, 246, 0.25) 40%, transparent 70%)',
        }}
      ></div>
      
      {/* Additional accent shape */}
      <div 
        className="absolute top-1/4 right-1/3 w-48 h-48 
                   rounded-full blur-2xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.25) 0%, transparent 60%)',
        }}
      ></div>
      
      <div className="relative z-10">
        <h2 className="text-4xl font-bold text-white mb-4">
          Start organizing your files
        </h2>
        
        <p className="text-lg text-white/90 mb-8 max-w-2xl">
          Upload, manage, and access your files from anywhere, anytime
        </p>
        
        <div className="flex flex-wrap gap-4">
          {/* Upload Button */}
          <button onClick={handleUploadFiles}
                  className="flex items-center gap-3 px-6 py-3.5 
                           bg-white text-blue-600 font-semibold rounded-xl
                           hover:bg-white/95 hover:scale-105 
                           transition-all duration-300 shadow-lg">
            <Upload className="w-5 h-5" />
            <span>Upload Files</span>
          </button>

          {/* New Folder Button */}
          <button onClick={handleNewFolder}
                  className="flex items-center gap-3 px-6 py-3.5 
                           bg-white/10 backdrop-blur-sm text-white 
                           font-semibold rounded-xl border border-white/30
                           hover:bg-white/20 hover:scale-105 
                           transition-all duration-300 shadow-lg">
            <FolderPlus className="w-5 h-5" />
            <span>New Folder</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default DiskStorageDisplay;