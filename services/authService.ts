
import { api } from './api';
import { User } from '../types';

export const authService = {
    login: async (email: string, password: string): Promise<User> => {
        try {
            const data = await api.login(email, password);
            localStorage.setItem('adscale_token', data.access_token);
            localStorage.setItem('adscale_user', JSON.stringify(data.user));
            return data.user;
        } catch (error) {
            console.error("Login failed", error);
            throw error;
        }
    },

    register: async (email: string, password: string, name: string): Promise<User> => {
        try {
            const data = await api.register(email, password, name);
            localStorage.setItem('adscale_token', data.access_token);
            localStorage.setItem('adscale_user', JSON.stringify(data.user));
            return data.user;
        } catch (error) {
            console.error("Registration failed", error);
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('adscale_token');
        localStorage.removeItem('adscale_user');
        window.location.reload();
    },

    getCurrentUser: async (): Promise<User | null> => {
        // First try local storage for speed
        const stored = localStorage.getItem('adscale_user');
        if (stored) return JSON.parse(stored);

        // If token exists but no user (or to validate), fetch me
        try {
            const user = await api.getMe();
            localStorage.setItem('adscale_user', JSON.stringify(user));
            return user;
        } catch (e) {
            return null;
        }
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('adscale_token');
    }
};
