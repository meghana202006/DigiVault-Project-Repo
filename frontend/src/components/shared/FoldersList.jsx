import React from 'react';
import FolderItem from './FolderItem';

const FoldersList = ({ folders, onFolderClick, onFolderEdit, onFolderDelete, deletingFolderId }) => {
  if (!folders || folders.length === 0) {
    return null;
  }

  return (
    <div className='divide-y divide-slate-700/50'>
      {folders.map((folder) => (
        <FolderItem
          key={folder._id}
          folder={folder}
          onClick={onFolderClick}
          onEdit={onFolderEdit}
          onDelete={onFolderDelete}
          isDeleting={deletingFolderId === folder._id}
        />
      ))}
    </div>
  );
};

export default FoldersList;

