import { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';

const useUser = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const fetchUser = async () => {
            try {
                // Use axiosInstance which automatically handles token refresh on 401
                const res = await axiosInstance.get('/users/getCurrentUser');

                if (isMounted) {
                    setUser(res.data);
                    setLoading(false);
                }
            } catch (err) {
                // axiosInstance interceptor handles token refresh automatically
                // If refresh fails, it redirects to login
                console.error('Error fetching user:', err);
                if (isMounted) {
                    setUser(null);
                    setLoading(false);
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