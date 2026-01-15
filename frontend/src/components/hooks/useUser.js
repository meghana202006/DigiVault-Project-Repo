import { useState, useEffect } from 'react';
import axios from 'axios';

const useUser = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        // Helper function to refresh token and fetch user data
        const refreshTokenAndFetchUser = async () => {
            try {
                const refreshRes = await axios.post(
                    'http://localhost:5000/api/users/refreshToken',
                    {},
                    { withCredentials: true }
                );
                
                if (refreshRes.data.token && isMounted) {
                    localStorage.setItem('accessToken', refreshRes.data.token);
                    // Fetch user with new token
                    const userRes = await axios.get('http://localhost:5000/api/users/getCurrentUser', {
                        headers: {
                            Authorization: `Bearer ${refreshRes.data.token}`
                        },
                        withCredentials: true,
                    });
                    if (isMounted) {
                        setUser(userRes.data);
                    }
                    return true; // Success
                } else {
                    if (isMounted) {
                        setUser(null);
                    }
                    return false; // Failed
                }
            } catch (refreshError) {
                // Refresh token expired or invalid
                if (isMounted) {
                    setUser(null);
                }
                return false; // Failed
            }
        };

        const fetchUser = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                
                if (!token) {
                    // No access token - try to refresh using refresh token cookie
                    await refreshTokenAndFetchUser();
                    if (isMounted) {
                        setLoading(false);
                    }
                    return;
                }

                // Try to fetch user with access token
                const res = await axios.get('http://localhost:5000/api/users/getCurrentUser', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    withCredentials: true,
                });

                if (isMounted) {
                    setUser(res.data);
                    setLoading(false);
                }
            } catch (err) {
                // Access token expired or invalid - try to refresh
                if (err.response?.status === 401) {
                    await refreshTokenAndFetchUser();
                    if (isMounted) {
                        setLoading(false);
                    }
                } else {
                    // Other error
                    console.error('Error fetching user:', err);
                    if (isMounted) {
                        setUser(null);
                        setLoading(false);
                    }
                }
            }
        };

        fetchUser();

        return () => {
            isMounted = false;
        };
    }, []);

    return { user, loading };
};

export default useUser;