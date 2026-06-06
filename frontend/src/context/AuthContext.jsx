import { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const { data } = await API.get('/auth/me');
                    data.role = Number(data.role);
                    setUser(data);
                    localStorage.setItem('user', JSON.stringify(data));
                } catch (err) {
                    console.error('Session expired', err);
                    logout();
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const fetchMe = async () => {
        const { data } = await API.get('/auth/me');
        data.role = Number(data.role);
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
        return data;
    };

    const login = async (email, password) => {
        const { data } = await API.post('/auth/login', { email, password });
        localStorage.setItem('token', data.access_token);
        return await fetchMe();
    };

    const register = async (name, email, password, phone, is_ngo = false) => {
        const { data } = await API.post('/auth/register', { name, email, password, phone, is_ngo });
        localStorage.setItem('token', data.access_token);
        return await fetchMe();
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
