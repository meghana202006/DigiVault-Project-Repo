import React, { memo } from 'react'
import {Search} from 'lucide-react'

const SearchBar = memo(function SearchBar() {
  return (
    <>
        <div className='relative'>
            <Search className='w-7 h-7 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 z-10 font-medium' />
            <input className='w-full h-16 rounded-2xl border border-slate-400/30 px-16 py-8 bg-slate-700/50 shadow-2xl placeholder-slate-400 text-slate-400 text-[20px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200' placeholder='Search for files and folders..'></input>
        </div>
    </>
  )
});

export default SearchBar