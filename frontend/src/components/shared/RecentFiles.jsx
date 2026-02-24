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

  // 1. Initial Load and Refresh Trigger Logic
  useEffect(() => {
    fetchRecentFiles();
  }, [fetchRecentFiles, refreshTrigger]);

  // 2. NEW: WebSocket Real-Time Listener
  useEffect(() => {
    // Replace with your actual backend URL/Port
    const socket = new WebSocket('ws://localhost:3000');

    socket.onopen = () => {
      console.log('Connected to File Update WebSocket');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Listen for the specific signal we set in the backend
        if (data.type === 'REFRESH_FILES') {
          console.log("Real-time update received. Refreshing list...");
          fetchRecentFiles();
        }
      } catch (err) {
        console.error("WebSocket message error:", err);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    // Cleanup connection when the component is removed from screen
    return () => {
      socket.close();
    };
  }, [fetchRecentFiles]);

  // 3. Existing Event Listener logic (keep this as a backup)
  useEffect(() => {
    const onCacheUpdated = () => fetchRecentFiles();
    window.addEventListener('files:cache-updated', onCacheUpdated);
    return () => window.removeEventListener('files:cache-updated', onCacheUpdated);
  }, [fetchRecentFiles]);

  if (loading) return null;
 

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