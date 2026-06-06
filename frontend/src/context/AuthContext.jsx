import { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const stored = localStorage.getItem('user');
        if (token && stored) {
            const parsedUser = JSON.parse(stored);
            parsedUser.role = Number(parsedUser.role);
            setUser(parsedUser);
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const { data } = await API.post('/auth/login', { email, password });
        localStorage.setItem('token', data.access_token);
        const u = { id: data.user_id, name: data.name, role: Number(data.role) };
        localStorage.setItem('user', JSON.stringify(u));
        setUser(u);
        return u;
    };

    const register = async (name, email, password, phone, is_ngo = false) => {
        const { data } = await API.post('/auth/register', { name, email, password, phone, is_ngo });
        localStorage.setItem('token', data.access_token);
        const u = { id: data.user_id, name: data.name, role: Number(data.role) };
        localStorage.setItem('user', JSON.stringify(u));
        setUser(u);
        return u;
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
