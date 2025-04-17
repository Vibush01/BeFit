import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userDetails, setUserDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            axios.get('http://localhost:5000/api/auth/profile', {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then(res => {
                    console.log('Profile response:', res.data); // Debug log
                    setUser({ id: res.data._id, role: res.data.role });
                    setUserDetails(res.data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Error fetching user profile:', err);
                    localStorage.removeItem('token');
                    setUser(null);
                    setUserDetails(null);
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password, role) => {
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', { email, password, role });
            console.log('Login response:', res.data); // Debug log
            localStorage.setItem('token', res.data.token);
            setUser({ id: res.data.user.id, role: res.data.user.role });
            setUserDetails(res.data.user);
            setLoading(false);
        } catch (err) {
            throw new Error(err.response?.data?.message || 'Failed to login');
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setUserDetails(null);
    };

    return (
        <AuthContext.Provider value={{ user, userDetails, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};