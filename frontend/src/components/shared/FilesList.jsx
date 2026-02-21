import React from 'react';
import FileListItem from './FileListItem';

const FilesList = ({ files, uploadingFiles = [], onFileDelete }) => {
  // Combine regular files and uploading files
  const allFiles = [
    ...uploadingFiles.map(upload => ({
      _id: `upload-${upload.id}`,
      name: upload.name,
      size: upload.size,
      fileType: upload.sectionType?.toLowerCase() || 'document',
      isUploading: true,
      uploadProgress: upload.progress,
      uploadStage: upload.stage,
      uploadStatus: upload.status
    })),
    ...(files || [])
  ];

  if (allFiles.length === 0) {
    return null;
  }

  return (
    <div className='bg-slate-800/30 rounded-lg border border-slate-700/50 overflow-hidden'>
      <div className='divide-y divide-slate-700/50'>
        {allFiles.map((file) => (
          <FileListItem
            key={file._id}
            file={file}
            isUploading={file.isUploading}
            uploadProgress={file.uploadProgress}
            uploadStage={file.uploadStage}
            uploadStatus={file.uploadStatus}
            onDelete={onFileDelete}
          />
        ))}
      </div>
    </div>
  );
};

export default FilesList;

