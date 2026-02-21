import React from 'react';
import NoFolderIcon from '../../assets/NoFolderIcon.png';

const EmptyFolderState = () => {
  return (
    <div 
      className='flex flex-col items-center justify-center py-16 px-5 rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 mt-6 mb-10'
      style={{ border: '2px dashed #94a3b8' }}
    >
      <img src={NoFolderIcon} alt="No Folder" className='w-50 h-50' />
      <div className='flex flex-col items-center justify-center mt-3'>
        <h2 className='text-white text-[28px] font-medium mb-2'>No Folders Found</h2>
        <p className='text-slate-400 text-[20px] font-medium text-center max-w-[300px]'>Create a new folder to start organizing your files.</p>
      </div>
    </div>
  );
};

export default EmptyFolderState;

