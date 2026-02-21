import React, { memo , useMemo } from 'react';
import { getFileIcon, getFileTypeLabel, getFileTypeColor } from '../../utils/fileHelpers';
import { formatFileSize, formatFileDate } from '../../utils/fileHelpers';
import { Eye , Trash2 , Edit2 , Download, Loader2, Check, X } from 'lucide-react';

const FileListItem = memo(function FileListItem({ file, isUploading, uploadProgress, uploadStage, uploadStatus, onDelete }) {
  const fileData = useMemo(()=>{
    if(!file) return null;
    
    // Handle uploading file (temporary object)
    if (isUploading) {
      return {
        IconComponent: getFileIcon(file?.fileType || 'document'),
        category: 'Uploading...',
        fileSize: formatFileSize(file?.size || 0),
        fileDate: uploadStage || 'Preparing...',
        fileName: file?.name || 'Unknown file',
        fileIconColor: 'from-cyan-500/80 to-blue-500/80',
      };
    }
    
    return {
      IconComponent: getFileIcon(file?.fileType),
      category: getFileTypeLabel(file?.fileType),
      fileSize: formatFileSize(file?.size),
      fileDate: formatFileDate(file?.createdAt),
      fileName: file?.name || file?.originalName || 'Unknown file',
      fileIconColor: getFileTypeColor(file?.fileType),
    }
  },[file?.fileType, file?.size, file?.createdAt, file?.name, file?.originalName, isUploading, uploadStage])
  
  if(!fileData) return null;
  const { IconComponent, category, fileSize, fileDate, fileName, fileIconColor } = fileData;

  return (
    <div className={`flex items-center justify-between py-6 px-8 transition-colors duration-200 ${
      isUploading ? 'bg-slate-700/30 border-l-4 border-cyan-400' : 'hover:bg-slate-600/30'
    }`}>
        <div className='flex items-center gap-4 flex-1 min-w-0'>
            <div className='flex-shrink-0'>
          <div className={`w-14 h-14 flex items-center justify-center bg-gradient-to-r ${fileIconColor} rounded-xl p-2 ${
            isUploading ? 'animate-pulse' : ''
          }`}>
            {isUploading && uploadStatus === 'uploading' ? (
              <Loader2 className='w-7 h-7 text-white animate-spin' />
            ) : isUploading && uploadStatus === 'success' ? (
              <Check className='w-7 h-7 text-white' />
            ) : isUploading && uploadStatus === 'error' ? (
              <X className='w-7 h-7 text-white' />
            ) : (
              <IconComponent className='w-7 h-7 text-white' />
            )}
                </div>
            </div>
           <div className='flex-1 min-w-0'>
          <div className='text-white font-semibold text-[20px] leading-tight truncate mb-1'>
              {fileName}
            </div>
          <div className='text-slate-400 text-sm flex items-center gap-1 text-[17px] mb-2'>
            <span className="">{category}</span>
            <span className='text-slate-500'>•</span>
            <span>{fileSize}</span>
            {!isUploading && (
              <>
                <span className='text-slate-500'>•</span>
                <span>{fileDate}</span>
              </>
            )}
            {isUploading && (
              <>
                <span className='text-slate-500'>•</span>
                {uploadStatus === 'error' ? (
                  <span className='text-red-400 font-medium'>{uploadStage || 'Failed'}</span>
                ) : (
                  <>
                    <span className='text-cyan-400 font-medium'>{uploadStage || 'Uploading...'}</span>
                    {uploadProgress !== undefined && (
                      <>
                        <span className='text-slate-500'>•</span>
                        <span className='text-cyan-400 font-semibold'>{Math.round(uploadProgress)}%</span>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </div>
           </div>
        </div>
      {!isUploading && (
        <div className='flex items-center gap-10'>
          <button>
            <Eye className='w-6 h-6 text-cyan-400 hover:text-cyan-300 transition-colors duration-200'/>
          </button>
          <button>
            <Edit2 className='w-6 h-6 text-amber-400 hover:text-amber-300 transition-colors duration-200'/>
          </button>
          <button>
            <Download className='w-6 h-6 text-emerald-400 hover:text-emerald-300 transition-colors duration-200'/>
          </button>
          <button
            onClick={() => {
              if (onDelete && !isUploading) {
                onDelete(file);
              }
            }}
            className="cursor-pointer"
          >
            <Trash2 className='w-6 h-6 text-red-500 hover:text-red-400 transition-colors duration-200'/>
          </button>
        </div>
      )}
    </div>
  );
});

export default FileListItem;