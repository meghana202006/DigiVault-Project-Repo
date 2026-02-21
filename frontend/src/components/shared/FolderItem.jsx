import React, { memo } from 'react';
import { Folder, Trash2, Edit2, Loader2 } from 'lucide-react';
import { formatFileDate } from '../../utils/fileHelpers';

const FolderItem = memo(function FolderItem({ folder, onClick, onEdit, onDelete, isDeleting = false }) {
  if (!folder) return null;

  const folderDate = formatFileDate(folder.createdAt);

  const handleFolderClick = (e) => {
    // Don't trigger folder click if clicking on action buttons or if deleting
    if (e.target.closest('button') || isDeleting) {
      return;
    }
    onClick && onClick(folder);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (isDeleting) return;
    onEdit && onEdit(folder);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (isDeleting) return;
    onDelete && onDelete(folder);
  };

  return (
    <div
      className={`flex items-center justify-between py-6 px-8 transition-colors duration-200 ${
        isDeleting 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:bg-slate-600/30 cursor-pointer'
      }`}
      onClick={handleFolderClick}
    >
      <div className='flex items-center gap-4 flex-1 min-w-0'>
        <div className='flex-shrink-0'>
          <div className='w-14 h-14 flex items-center justify-center bg-gradient-to-r from-amber-400 to-amber-500 rounded-xl p-2'>
            <Folder className='w-7 h-7 text-white' />
          </div>
        </div>
        <div className='flex-1 min-w-0'>
          <div className='text-white font-semibold text-[20px] leading-tight truncate mb-1'>
            {folder.name}
          </div>
          <div className='text-slate-400 text-sm flex items-center gap-1 text-[17px]'>
            <span>Folder</span>
            <span className='text-slate-500'>•</span>
            <span>{folderDate}</span>
            {isDeleting && (
              <>
                <span className='text-slate-500'>•</span>
                <span className='text-red-400'>Deleting...</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className='flex items-center gap-12'>
        <button 
          onClick={handleEdit} 
          disabled={isDeleting}
          aria-label="Edit folder"
          className={isDeleting ? 'opacity-50 cursor-not-allowed' : ''}
        >
          <Edit2 className='w-6 h-6 text-slate-400 hover:text-slate-300 transition-colors duration-200'/>
        </button>
        <button 
          onClick={handleDelete} 
          disabled={isDeleting}
          aria-label="Delete folder"
          className={isDeleting ? 'opacity-50 cursor-not-allowed' : ''}
        >
          {isDeleting ? (
            <Loader2 className='w-6 h-6 text-red-500 animate-spin'/>
          ) : (
            <Trash2 className='w-6 h-6 text-red-500 hover:text-red-400 transition-colors duration-200'/>
          )}
        </button>
      </div>
    </div>
  );
});

export default FolderItem;

