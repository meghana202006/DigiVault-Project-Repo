import { useState, useEffect, useCallback } from 'react';
import { checkEmailAvailability } from '../../utils/checkUsername';

/**
 * Custom hook for checking email availability with debounce
 * @param {number} debounceDelay - Delay in milliseconds (default: 500)
 * @returns {Object} { status, checkEmail, resetStatus }
 */
const useEmailAvailability = (debounceDelay = 500) => {
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
   * Check email availability (with debounce)
   * @param {string} email - The email to check
   */
  const checkEmail = useCallback((email) => {
    // Reset status when email is empty
    if (!email || email.trim() === '') {
      setStatus({ checking: false, available: null, message: '' });
      setDebounceTimer(prev => {
        if (prev) clearTimeout(prev);
        return null;
      });
      return;
    }

    // Check if email has @ symbol (basic check - let backend validate format)
    if (!email.includes('@')) {
      // No @ symbol yet - reset status
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

      try {
        const result = await checkEmailAvailability(email);
        
        // Handle result - if available is null, it means format error (not an actual error)
        setStatus({
          checking: false,
          available: result.available,
          message: result.message
        });
      } catch (error) {
        console.error('Email check error:', error);
        setStatus({
          checking: false,
          available: false,
          message: 'Error checking email'
        });
      }
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
   * Manually trigger email check (without debounce)
   * Useful for form submission validation
   */
  const checkEmailImmediate = useCallback(async (email) => {
    if (!email || email.trim() === '') {
      setStatus({ checking: false, available: null, message: '' });
      return;
    }

    setStatus({ checking: true, available: null, message: 'Checking...' });

    try {
      const result = await checkEmailAvailability(email);
      
      // Handle result - if available is null, it means format error (not an actual error)
      setStatus({
        checking: false,
        available: result.available,
        message: result.message
      });
    } catch (error) {
      console.error('Email check error:', error);
      setStatus({
        checking: false,
        available: false,
        message: 'Error checking email'
      });
    }
  }, []);

  return {
    status,
    checkEmail,
    checkEmailImmediate,
    resetStatus
  };
};

export default useEmailAvailability;

