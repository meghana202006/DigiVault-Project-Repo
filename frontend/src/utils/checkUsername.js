import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/users';

/**
 * Check if a username is available
 * @param {string} username - The username to check
 * @returns {Promise<{available: boolean|null, message: string, error: boolean}>}
 */
export const checkUsernameAvailability = async (username) => {
    // Return early if username is empty
    if (!username || username.trim() === '') {
        return {
            available: null,
            message: '',
            error: false
        };
    }

    try {
        const response = await axios.post(
            `${API_BASE_URL}/checkUsername`,
            { username: username.trim() }
        );
        
        return {
            available: response.data.available,
            message: response.data.message,
            error: false
        };
    } catch (err) {
        return {
            available: false,
            message: err.response?.data?.message || 'Error checking username',
            error: true
        };
    }
};

/**
 * Check if an email is available
 * @param {string} email - The email to check
 * @returns {Promise<{available: boolean|null, message: string, error: boolean}>}
 */
export const checkEmailAvailability = async (email) => {
    // Return early if email is empty
    if (!email || email.trim() === '') {
        return {
            available: null,
            message: '',
            error: false
        };
    }

    try {
        const response = await axios.post(
            `${API_BASE_URL}/checkEmail`,
            { email: email.trim() }
        );
        
        return {
            available: response.data.available,
            message: response.data.message,
            error: false
        };
    } catch (err) {
        // Handle both 400 (invalid format) and 500 (server error) responses
        const errorMessage = err.response?.data?.message || 'Error checking email';
        const isFormatError = err.response?.status === 400 && errorMessage.includes('format');
        
        return {
            available: isFormatError ? null : false, // null for format errors, false for taken/other errors
            message: errorMessage,
            error: !isFormatError // Only mark as error if not a format validation issue
        };
    }
};

