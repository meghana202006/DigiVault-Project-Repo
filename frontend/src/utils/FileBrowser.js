import React, { useEffect, useState } from 'react';

const FileBrowser = () => {
    const [files, setFiles] = useState([]);

    // This function fetches from your API (which reads from Redis)
    const fetchFiles = async () => {
        const response = await fetch('http://localhost:3000/api/files');
        const data = await response.json();
        setFiles(data);
    };

    useEffect(() => {
        fetchFiles(); // Initial fetch on page load

        // Connect to WebSocket (using 'ws' for localhost)
        const socket = new WebSocket('ws://localhost:3000');

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'REFRESH_FILES') {
                console.log("Data changed in Redis, re-fetching...");
                fetchFiles(); // TRIGGER RE-FETCH
            }
        };

        return () => socket.close(); // Cleanup on close
    }, []);

    return (
        <div>
            {files.map(file => <div key={file.id}>{file.name}</div>)}
        </div>
    );
};