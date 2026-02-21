import React, { memo , useState , useEffect, useCallback } from 'react'
import EmptyRecentFiles from './EmptyRecentFiles';
import FilesList from './FilesList';
import axiosInstance from '../../utils/axiosInstance';

const RecentFiles = memo(function RecentFiles({ 
  onUploadSuccessWithData, 
  refreshTrigger = 0,
  sectionId = null
}) {
  const [files , setFiles] = useState([]);
  const [loading , setLoading] = useState(true);

  const fetchRecentFiles = useCallback(async () => {
    try {
      setLoading(true);
      // Use dedicated /recent endpoint which fetches from Redis sorted sets (10 most recent, auto-trimmed)
      // If sectionId is provided, fetches from 'recent_files:user:<userId>:<sectionId>'
      // If sectionId is null, fetches from 'recent_files:user:<userId>' (all sections)
      const params = { limit: 10, _: Date.now() };
      if (sectionId) {
        params.section = sectionId;
      }
      
      const res = await axiosInstance.get("/files/recent", { params });
      setFiles(res.data?.files || []);
    } catch (err) {
      console.error("Error fetching recent files:", err);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [sectionId]);

  useEffect(() => {
    fetchRecentFiles();
  }, [fetchRecentFiles, refreshTrigger]);

  // Auto-refresh when Redis is updated (e.g. after successful upload from any section)
  useEffect(() => {
    const onCacheUpdated = () => fetchRecentFiles();
    window.addEventListener('files:cache-updated', onCacheUpdated);
    return () => window.removeEventListener('files:cache-updated', onCacheUpdated);
  }, [fetchRecentFiles]);

  // Return files list only (no header, no container)
  if (loading) {
    return null; // You can add a skeleton loader here if needed
  }

  if (files.length === 0) {
    return (
      <EmptyRecentFiles
        onUploadSuccess={(data) => {
          fetchRecentFiles();
          onUploadSuccessWithData?.(data);
        }}
      />
    );
  }

  return <FilesList files={files} />;
});

export default RecentFiles