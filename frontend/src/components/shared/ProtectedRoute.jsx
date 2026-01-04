import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';

function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      
      if (!accessToken) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      // Optionally verify token with backend
      // For now, just check if token exists
      // You can add token validation here if needed
      try {
        // You can verify token with backend endpoint if needed
        setIsAuthenticated(true);
      } catch (error) {
        // Token invalid, try to refresh
        try {
          const refreshRes = await axios.post(
            'http://localhost:5000/api/users/refreshToken',
            {},
            { withCredentials: true }
          );
          
          if (refreshRes.data.token) {
            localStorage.setItem('accessToken', refreshRes.data.token);
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
            localStorage.removeItem('accessToken');
          }
        } catch (refreshError) {
          setIsAuthenticated(false);
          localStorage.removeItem('accessToken');
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login and save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;



