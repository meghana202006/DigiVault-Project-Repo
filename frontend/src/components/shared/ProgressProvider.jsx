import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ProgressContext = createContext();

export const ProgressProvider = ({ children }) => {
    // Stores progress as { fileId: { progress: number, stage: string, isSocketData: boolean } }
    const [uploads, setUploads] = useState({});

    /**
     * MANUAL UPDATE: Call this from your Axios/Fetch upload function.
     * It scales 0-100% local progress to 0-50% on the UI.
     */
    const updateLocalProgress = useCallback((fileId, percent) => {
        setUploads((prev) => {
            // If we already started receiving socket data (50%+), ignore local updates
            if (prev[fileId]?.isSocketData) return prev;

            return {
                ...prev,
                [fileId]: {
                    progress: Math.round(percent / 2), // Scale 100% down to 50%
                    stage: 'Uploading to server...',
                    isSocketData: false
                }
            };
        });
    }, []);

    useEffect(() => {
        // Replace with your actual production WebSocket URL
        const socket = new WebSocket('ws://localhost:5000'); 

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // 1. Handle Real-time Progress from Backend (50% - 100%)
                if (data.type === 'UPLOAD_PROGRESS') {
                    setUploads((prev) => ({
                        ...prev,
                        [data.fileId]: {
                            progress: data.progress, // Backend already sends 50-100
                            stage: data.stage || 'Syncing to Cloud',
                            isSocketData: true // Mark as socket data to override local
                        },
                    }));
                }

                // 2. Handle Completion & Cleanup
                if (data.type === 'REFRESH_FILES') {
                    setUploads((prev) => {
                        const newUploads = { ...prev };
                        // Remove the tracker so the FileListItem returns to "normal" mode
                        delete newUploads[data.fileId || data.userId]; 
                        return newUploads;
                    });
                }
            } catch (err) {
                console.error("Error parsing socket message", err);
            }
        };

        socket.onclose = () => console.log("Upload Socket disconnected");

        return () => socket.close();
    }, []);

    return (
        <ProgressContext.Provider value={{ uploads, updateLocalProgress }}>
            {children}
        </ProgressContext.Provider>
    );
};

export const useUploadProgress = () => useContext(ProgressContext);