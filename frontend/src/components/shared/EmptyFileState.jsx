import React from 'react';
import NoFileIcon from '../../assets/NoFileIcon.png';

const EmptyFileState = () => {
  return (
    <div 
      className='flex flex-col items-center justify-center py-16 px-5 rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 mt-6 mb-10'
      style={{ border: '2px dashed #94a3b8' }}
    >
      <img src={NoFileIcon} alt="No File" className='w-80 h-80 text-slate-400' />
      <div className='flex flex-col items-center justify-center mt-3'>
        <h2 className='text-white text-[28px] font-medium mb-2'>No Files Found</h2>
        <p className='text-slate-400 text-[20px] font-medium text-center max-w-[300px]'>Upload a file to start storing your documents.</p>
      </div>
    </div>
  );
};

export default EmptyFileState;

