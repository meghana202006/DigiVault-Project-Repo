import { useState, useCallback, useRef, useEffect } from 'react';
import { checkFolderNameAvailability } from '../../utils/folderApi';

/**
 * Optimized Hook for checking folder name availability
 */
const useFolderNameAvailability = (sectionType, debounceDelay = 300) => {
  const [status, setStatus] = useState({
    checking: false,
    available: null,
    message: ''
  });

  // refs do not trigger re-renders when they change
  const timerRef = useRef(null);
  const abortControllerRef = useRef(null);

  const checkFolderName = useCallback((folderName) => {
    const trimmedName = folderName?.trim();

    // 1. Clear previous timer and cancel pending API requests
    if (timerRef.current) clearTimeout(timerRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();

    // 2. Handle empty input
    if (!trimmedName || trimmedName.length < 1) {
      setStatus({ checking: false, available: null, message: '' });
      return;
    }

    // 3. Update UI to "Checking" immediately for better UX
    setStatus({ checking: true, available: null, message: 'Checking...' });

    // 4. Start the debounce timer
    timerRef.current = setTimeout(async () => {
      // Create a new controller for this specific request
      abortControllerRef.current = new AbortController();
      
      try {
        const result = await checkFolderNameAvailability(trimmedName, sectionType, {
          signal: abortControllerRef.current.signal
        });
        
        setStatus({
          checking: false,
          available: result.available, // true or false from backend
          message: result.message
        });
      } catch (error) {
        // If the request was cancelled by a newer keystroke, do nothing
        if (error.name === 'AbortError' || error.name === 'CanceledError') {
          return;
        }
        
        console.error('Folder check error:', error);
        setStatus({
          checking: false,
          available: false,
          message: 'Error checking availability'
        });
      }
    }, debounceDelay);
  }, [sectionType, debounceDelay]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  // Helper to clear everything manually
  const resetStatus = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setStatus({ checking: false, available: null, message: '' });
  }, []);

  return {
    status,
    checkFolderName,
    resetStatus
  };
};

export default useFolderNameAvailability;