import React, { memo } from 'react'

const VaultHeader = memo(function VaultHeader({ user, onProfileClick }) {
  return (
    <>
        <header className='flex items-start justify-between mb-8'>
                  <div className="flex-1">
                    <h1 className="text-4xl font-bold text-white mb-4">
                      Welcome back,{' '}
                      <span className='bg-gradient-to-r from-cyan-500 to-blue-500 text-transparent bg-clip-text'>
                        {user?.name || 'User'}
                      </span>
                    </h1>
                    <p className="text-slate-300 text-[20px]">Manage your files securely and efficiently</p>
                  </div>
                  {user && (
                    <button
                      type="button"
                      onClick={onProfileClick}
                      className='flex items-center gap-5 ml-8 rounded-xl hover:ring-2 hover:ring-cyan-500/50 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/50'
                    >
                      <div className='flex flex-col gap-1 text-right'>
                        <div className='text-white text-2xl font-bold'>{user?.name || 'User'}</div>
                        <div className='text-slate-400 text-lg'>{user?.email || ''}</div>
                      </div>
                      <div className='w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 shadow-2xl border-2 border-slate-500 cursor-pointer hover:opacity-90 transition-opacity'>
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    </button>
                  )}
                </header>
    </>
  )
});

export default VaultHeader