import { useState, useEffect, useCallback } from 'react';
import { checkUsernameAvailability } from '../../utils/checkUsername';

/**
 * Custom hook for checking username availability with debounce
 * @param {number} debounceDelay - Delay in milliseconds (default: 500)
 * @returns {Object} { status, checkUsername, resetStatus }
 */
const useUsernameAvailability = (debounceDelay = 500) => {
  const [status, setStatus] = useState({
    checking: false,
    available: null, // null = not checked, true = available, false = taken
    message: ''
  });
  const [debounceTimer, setDebounceTimer] = useState(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  /**
   * Check username availability (with debounce)
   * @param {string} username - The username to check
   */
  const checkUsername = useCallback((username) => {
    // Reset status when username is empty
    if (!username || username.trim() === '') {
      setStatus({ checking: false, available: null, message: '' });
      setDebounceTimer(prev => {
        if (prev) clearTimeout(prev);
        return null;
      });
      return;
    }

    // Clear previous timer
    setDebounceTimer(prev => {
      if (prev) clearTimeout(prev);
      return null;
    });

    // Set new timer (wait after user stops typing)
    const timer = setTimeout(async () => {
      setStatus({ checking: true, available: null, message: 'Checking...' });

      const result = await checkUsernameAvailability(username);
      
      setStatus({
        checking: false,
        available: result.available,
        message: result.message
      });
    }, debounceDelay);
    
    setDebounceTimer(timer);
  }, [debounceDelay]);

  /**
   * Reset the status
   */
  const resetStatus = useCallback(() => {
    setDebounceTimer(prev => {
      if (prev) clearTimeout(prev);
      return null;
    });
    setStatus({ checking: false, available: null, message: '' });
  }, []);

  /**
   * Manually trigger username check (without debounce)
   * Useful for form submission validation
   */
  const checkUsernameImmediate = useCallback(async (username) => {
    if (!username || username.trim() === '') {
      setStatus({ checking: false, available: null, message: '' });
      return;
    }

    setStatus({ checking: true, available: null, message: 'Checking...' });

    const result = await checkUsernameAvailability(username);
    
    setStatus({
      checking: false,
      available: result.available,
      message: result.message
    });
  }, []);

  return {
    status,
    checkUsername,
    checkUsernameImmediate,
    resetStatus
  };
};

export default useUsernameAvailability;

