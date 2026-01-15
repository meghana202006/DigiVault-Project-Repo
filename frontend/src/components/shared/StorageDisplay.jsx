import React from 'react'

function StorageDisplay({storage, icon , section, color}) {
  const IconComponent = icon;
  
  return (
    <div className='max-w-2xl max-h-xl bg-slate-700/50 backdrop-blur-sm shadow-2xl border border-slate-400/30 rounded-2xl px-8 py-8'>
      <div className={`w-20 h-20 p-8 flex justify-center items-center rounded-full shadow-2xl text-white ${color ? `bg-gradient-to-r ${color}` : 'bg-gradient-to-r from-slate-600 to-slate-700'}`}>
        <IconComponent className='w-[80px] h-[80px] text-white'/>
      </div>
      <div className='text-white text-[22px] font-bold'>{storage} GB</div>
      <p className='text-slate-400 text-[20px] font-medium'>{section}</p>
      <hr className='border-slate-400/30 my-4'></hr>
      <p>Last Updated: 08/01/2026</p>
    </div>
  )
}

export default StorageDisplay