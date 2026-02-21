import axios from 'axios';
import { getApiBaseURL } from './axiosInstance';

const getUsersApiURL = () => `${getApiBaseURL()}/users`;

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
            `${getUsersApiURL()}/checkUsername`,
            { username: username.trim() }
        );
        
        return {
            available: response.data.available,
            message: response.data.message,
            error: false
        };
    } catch (err) {
        console.log(err)
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
            `${getUsersApiURL()}/checkEmail`,
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

