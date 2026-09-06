import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const token = localStorage.getItem('token');
		const storedUser = localStorage.getItem('user');
		if (token && storedUser) {
			setUser(JSON.parse(storedUser));
		}
		setLoading(false);
	}, []);

	async function login(email, password) {
		try {
			const { data } = await api.post('/auth/login', { email, password });
			
			if (data.success) {
				localStorage.setItem('token', data.data.token);
				localStorage.setItem('user', JSON.stringify(data.data.user));
				setUser(data.data.user);
				return data;
			} else {
				throw new Error(data.message || 'Login failed');
			}
		} catch (error) {
			if (error.response?.data?.message) {
				throw new Error(error.response.data.message);
			}
			throw error;
		}
	}

	async function register(payload) {
		try {
			const { data } = await api.post('/auth/register', payload);
			
			if (data.success) {
				localStorage.setItem('token', data.data.token);
				localStorage.setItem('user', JSON.stringify(data.data.user));
				setUser(data.data.user);
				return data;
			} else {
				throw new Error(data.message || 'Registration failed');
			}
		} catch (error) {
			if (error.response?.data?.message) {
				throw new Error(error.response.data.message);
			}
			throw error;
		}
	}

	function logout() {
		localStorage.removeItem('token');
		localStorage.removeItem('user');
		setUser(null);
	}

	const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading]);
	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	return useContext(AuthContext);
}


