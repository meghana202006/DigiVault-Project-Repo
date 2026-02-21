import React from 'react'
import { FileText, FolderPlus, Upload , Home} from 'lucide-react';

function SectionHeader({icon : IconComponent , title , fileCount , folderCount , color , onNewFolderClick , onUploadFileClick}) {
  return (
    <div className="flex items-center justify-between mb-8 mt-10">
        <div className='flex items-center gap-8'>
          <button className='w-10 h-10 text-slate-400 hover:text-slate-300 transition-colors duration-200'>
            <Home className='w-8 h-8'/>
          </button>
            <div className={`w-15 h-15 p-3 flex justify-center items-center rounded-xl shadow-lg text-white bg-gradient-to-r ${color ? `bg-gradient-to-r ${color}` : 'bg-gradient-to-r from-cyan-500 to-blue-500'}`}>
                <IconComponent className='w-8 h-8 text-white'/>
            </div>
            <div className='flex flex-col gap-1'>
            <h2 className="text-3xl font-bold text-white">{title}</h2>
            <p className="text-slate-400 text-lg">{fileCount} files and {folderCount} folders</p>
            </div>
        </div>
        <div className='flex items-center gap-3'>
          <button className='w-50 h-14 bg-gradient-to-r from-slate-600 to-slate-600 text-white p-3 rounded-md flex items-center justify-center hover:from-slate-500 hover:to-slate-500 transition-all gap-3' onClick={()=>onNewFolderClick(true)}>
            <FolderPlus className='w-7 h-7'/>
            <span className='text-xl font-medium'>New Folder</span>
          </button>
          <button className='w-50 h-14 bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-3 rounded-md flex items-center justify-center hover:from-slate-500 hover:to-slate-500 transition-all gap-3' onClick={()=>onUploadFileClick(true)}>
            <Upload className='w-6 h-6'/>
            <span className='text-xl font-medium'>Upload file</span>
          </button>
        </div>
    </div>
  )
}

export default SectionHeader