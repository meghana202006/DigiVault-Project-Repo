import axios from 'axios';

// Use same-origin /api in browser so Vite proxy (dev) or same host (prod) is used.
// This avoids cross-origin issues and ensures the refresh token cookie is sent.
export const getApiBaseURL = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }
  return 'http://localhost:5000/api';
};

const axiosInstance = axios.create({
  baseURL: getApiBaseURL(),
  withCredentials: true,
  timeout: 60000
});

// Flag to prevent multiple simultaneous refresh requests
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor - add token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh on 401
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 or 403 (authentication/authorization failure) and we haven't already tried to refresh
    // Handle both 401 and 403 as they both indicate token issues that can be resolved by refresh
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token (use plain axios to avoid interceptor loop)
        // Use same-origin URL so proxy sends the request and cookie is included
        const refreshURL = `${getApiBaseURL()}/users/refreshToken`;
        const refreshResponse = await axios.post(
          refreshURL,
          {},
          { 
            withCredentials: true,
            timeout: 10000 // 10 second timeout for refresh
          }
        );

        if (refreshResponse.data.token) {
          // Store new token
          localStorage.setItem('accessToken', refreshResponse.data.token);
          
          // Update authorization header
          originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.token}`;
          
          // Process queued requests
          processQueue(null, refreshResponse.data.token);
          
          // Retry original request
          return axiosInstance(originalRequest);
        } else {
          throw new Error('No token in refresh response');
        }
      } catch (refreshError) {
        // Refresh failed - clear token and redirect to login
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        
        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // For other errors, just reject
    return Promise.reject(error);
  }
);

export default axiosInstance;

