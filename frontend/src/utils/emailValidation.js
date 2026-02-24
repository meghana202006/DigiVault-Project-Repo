/**
 * Validates a string against Gmail's specific username and domain rules.
 * @param {string} email 
 * @returns {Object} { isValid: boolean, error: string }
 */
export const validateGmail = (email) => {
  if (!email) return { isValid: false, error: '' };
  
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail.includes('@')) {
      return { isValid: false, error: 'Please enter a valid email' };
  }

  const [username, domain] = trimmedEmail.split('@');

  // 1. Domain Check
  if (domain !== 'gmail.com') {
    return { isValid: false, error: 'Please use a @gmail.com address' };
  }

  // 2. Character Check (Letters, numbers, dots only)
  const validCharsRegex = /^[a-z0-9.]+$/;
  if (!validCharsRegex.test(username)) {
    return { isValid: false, error: 'Gmail usernames only allow letters, numbers, and dots' };
  }

  // 3. Dot Rules
  if (username.startsWith('.') || username.endsWith('.') || username.includes('..')) {
    return { isValid: false, error: 'Invalid placement of dots' };
  }

  // 4. Length Check (excluding dots)
  const cleanUsername = username.replace(/\./g, '');
  if (cleanUsername.length < 6 || cleanUsername.length > 30) {
    return { isValid: false, error: 'Username must be between 6 and 30 characters' };
  }

  return { isValid: true, error: '' };
};