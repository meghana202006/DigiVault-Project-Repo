import React, { memo } from 'react'

const StorageDisplay = memo(function StorageDisplay({storage, lastUpdated, icon , section, color , borderStart , borderEnd}) {
  const IconComponent = icon;
  
  // Format storage value to appropriate unit (KB, MB, or GB)
  const formatStorage = (storageInGB) => {
    if (storageInGB === 0) return '0 KB';
    
    // Convert GB to bytes first
    const bytes = storageInGB * 1024 * 1024 * 1024;
    
    // Determine appropriate unit
    if (bytes < 1024) {
      // Less than 1 KB, show in bytes
      return `${Math.round(bytes)} B`;
    } else if (bytes < 1024 * 1024) {
      // Less than 1 MB, show in KB
      const kb = bytes / 1024;
      return `${kb < 1 ? kb.toFixed(2) : Math.round(kb * 100) / 100} KB`;
    } else if (bytes < 1024 * 1024 * 1024) {
      // Less than 1 GB, show in MB
      const mb = bytes / (1024 * 1024);
      return `${mb < 1 ? mb.toFixed(2) : Math.round(mb * 100) / 100} MB`;
    } else {
      // 1 GB or more, show in GB
      return `${Math.round(storageInGB * 100) / 100} GB`;
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  return (
    <div className='card-animated max-w-md max-h-xl bg-slate-700/50 shadow-xl border border-slate-400/30 rounded-3xl px-8 py-8  cursor-pointer 
                 transition-all duration-300 
                 hover:bg-white/10 
                 hover:border-white/10 
                 hover:-translate-y-2 
                 hover:shadow-2xl
                 bg-gradient-to-r from-slate-700 to-slate-900' 
                 
                 style={{
                  '--border-start': borderStart,
                  '--border-end': borderEnd
                }}>
      <div className={`w-20 h-20 p-6 flex justify-center items-center rounded-full shadow-lg text-white ${color ? `bg-gradient-to-r ${color}` : 'bg-gradient-to-r from-slate-600 to-slate-700'}`}>
        <IconComponent className='w-10 h-10 text-white'/>
      </div>
      <div className='flex flex-col gap-2 mt-3'>
      <div className='text-white text-[22px] font-bold'>{formatStorage(storage)}</div>
      <p className='text-slate-400 text-[20px] font-medium'>{section}</p>
      </div>
      <hr className='border-slate-400/30 my-4'></hr>
      <p className='text-slate-400 text-sm'>Last Updated: {formatDate(lastUpdated)}</p>
    </div>
  )
});

export default StorageDisplay