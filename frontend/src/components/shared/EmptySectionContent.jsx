import React from 'react'
import EmptyFolderState from './EmptyFolderState'
import EmptyFileState from './EmptyFileState'

function EmptySectionContent() {
  return (
    <>
      <div className='flex flex-col'>
          <h2 className='text-white text-[28px] font-medium mt-2'>Folders Section</h2>
          <EmptyFolderState />
          <div className='flex flex-col'>
            <h2 className='text-white text-[28px] font-medium mt-10'>Files Section</h2>
            <EmptyFileState />
          </div>
          <div className='h-32'></div>
      </div>
    </>
  )
}

export default EmptySectionContent