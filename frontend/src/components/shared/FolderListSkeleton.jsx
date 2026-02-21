import React from 'react';

const FolderListSkeleton = ({ count = 3 }) => {
  const skeletonItems = [
    { nameWidth: '75%', metaWidth: '50%' },
    { nameWidth: '65%', metaWidth: '45%' },
    { nameWidth: '80%', metaWidth: '55%' }
  ];

  return (
    <div className='bg-slate-800/30 rounded-lg border border-slate-700/50 mt-6 divide-y divide-slate-700/50'>
      {Array.from({ length: count }).map((_, index) => {
        const item = skeletonItems[index] || skeletonItems[0];
        return (
          <div
            key={index}
            className='flex items-center justify-between py-6 px-8'
            style={{
              animation: `fadeIn 0.3s ease-out ${index * 0.1}s forwards`,
              opacity: 0
            }}
          >
            <div className='flex items-center gap-4 flex-1 min-w-0'>
              {/* Folder Icon Skeleton */}
              <div className='flex-shrink-0'>
                <div 
                  className='w-14 h-14 rounded-xl overflow-hidden relative skeleton-shimmer'
                ></div>
              </div>
              
              {/* Folder Info Skeleton */}
              <div className='flex-1 min-w-0 space-y-2'>
                {/* Folder Name Skeleton */}
                <div 
                  className='h-6 rounded-md skeleton-shimmer'
                  style={{ width: item.nameWidth }}
                ></div>
                
                {/* Folder Meta Skeleton */}
                <div 
                  className='h-5 rounded-md skeleton-shimmer'
                  style={{ 
                    width: item.metaWidth,
                    animationDelay: '0.1s'
                  }}
                ></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FolderListSkeleton;

