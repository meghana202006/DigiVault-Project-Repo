import { useState, useEffect, useCallback, useRef } from 'react';
import { validateGmail } from '../../utils/emailValidation';
import { checkEmailAvailability } from '../../utils/checkUsername'; // Ensure this points to the Email API helper

const useEmailAvailability = (debounceDelay = 500) => {
  const [status, setStatus] = useState({
    checking: false,
    available: null, // true if format is OK AND email is free
    message: '',
    isFormatValid: false,
  });

  const timerRef = useRef(null);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  useEffect(() => {
    return clearTimer;
  }, []);

  const checkEmail = useCallback((email) => {
    clearTimer();

    // 1. Reset if empty
    if (!email || email.trim() === '') {
      setStatus({ checking: false, available: null, message: '', isFormatValid: false });
      return;
    }
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      setStatus({ 
        checking: false, 
        available: false, 
        message: 'Please also use @gmail.com', 
        isFormatValid: false 
      });
      return;
    }

    // 2. Step One: Format Validation (Instant)
    const formatResult = validateGmail(email);
    
    if (!formatResult.isValid) {
      // If format is wrong, we stop here and show the format error
      setStatus({ 
        checking: false, 
        available: false, 
        message: formatResult.error, 
        isFormatValid: false 
      });
      return;
    }

    // 3. Step Two: Availability Check (Debounced)
    // Format is valid, so now we show "Checking..." and wait for user to stop typing
    setStatus({ 
      checking: true, 
      available: null, 
      message: 'Checking availability...', 
      isFormatValid: true 
    });

    timerRef.current = setTimeout(async () => {
      try {
        const result = await checkEmailAvailability(email);
        setStatus({
          checking: false,
          available: result.available,
          message: result.message,
          isFormatValid: true
        });
      } catch (error) {
        setStatus({ 
          checking: false, 
          available: false, 
          message: 'Error verifying email', 
          isFormatValid: true 
        });
      }
    }, debounceDelay);
  }, [debounceDelay]);

  const checkEmailImmediate = useCallback(async (email) => {
    clearTimer();
    const formatResult = validateGmail(email);
    if (!formatResult.isValid) return false;

    const result = await checkEmailAvailability(email);
    return result.available;
  }, []);

  const resetStatus = useCallback(() => {
    clearTimer();
    setStatus({ checking: false, available: null, message: '', isFormatValid: false });
  }, []);

  return { status, checkEmail, checkEmailImmediate, resetStatus };
};

export default useEmailAvailability;