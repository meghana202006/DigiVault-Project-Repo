import { useState, useEffect } from 'react';
import { validateGmail } from '../../utils/emailValidation';

export const useGmailValidation = (emailValue) => {
  const [status, setStatus] = useState({ isValid: false, error: '' });

  useEffect(() => {
    const handler = setTimeout(() => {
      const result = validateGmail(emailValue);
      setStatus(result);
    }, 400);

    return () => clearTimeout(handler);
  }, [emailValue]);

  return status;
};