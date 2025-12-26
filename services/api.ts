
import { Ad, User } from '../types';


const API_URL = 'http://127.0.0.1:8000';

const getHeaders = () => {
    const token = localStorage.getItem('adscale_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const api = {
    // --- ADS ---
    getAds: async (): Promise<Ad[]> => {
        const response = await fetch(`${API_URL}/ads`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch ads');
        return response.json();
    },

    createAd: async (ad: Omit<Ad, 'addedAt'>): Promise<Ad> => {
        const response = await fetch(`${API_URL}/ads`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(ad),
        });
        if (!response.ok) throw new Error('Failed to create ad');
        return response.json();
    },

    importAds: async (ads: Omit<Ad, 'addedAt'>[]): Promise<any> => {
        const payload = JSON.stringify(ads);
        const sizeMB = (payload.length / (1024 * 1024)).toFixed(2);
        console.log(`[api] Iniciando fetch para /ads/import. Tamanho do payload: ${sizeMB} MB`);

        try {
            // Add a timeout to fail fast if network is dead
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

            const response = await fetch(`${API_URL}/ads/import`, {
                method: 'POST',
                headers: getHeaders(),
                body: payload,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("Import API Error Status:", response.status, response.statusText);
                console.error("Import API Error Body:", errorData);
                const errorMessage = Array.isArray(errorData.detail)
                    ? errorData.detail.map((e: any) => `${e.loc.join('.')} - ${e.msg}`).join('\n')
                    : (errorData.detail || `Erro ${response.status}: ${response.statusText}`);
                throw new Error(errorMessage);
            }
            return response.json();
        } catch (e: any) {
            console.error("[api] CRITICAL FETCH ERROR:", e.name, e.message);
            if (e.name === 'AbortError') {
                throw new Error("O upload demorou muito e cancelou (Timeout). Tente menos linhas.");
            }
            if (e.message.includes('Failed to fetch')) {
                throw new Error("Erro de conexão (Failed to fetch). Verifique se o Backend está rodando e se a URL está correta.");
            }
            throw e;
        }
    },

    updateAd: async (id: string, ad: Partial<Ad>): Promise<Ad> => {
        const response = await fetch(`${API_URL}/ads/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(ad),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Update API Error:", errorData);
            const errorMessage = Array.isArray(errorData.detail)
                ? errorData.detail.map((e: any) => `${e.loc.join('.')} - ${e.msg}`).join('\n')
                : (errorData.detail || 'Falha ao atualizar anúncio');
            throw new Error(errorMessage);
        }
        return response.json();
    },

    deleteAd: async (id: string): Promise<void> => {
        const response = await fetch(`${API_URL}/ads/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to delete ad');
    },

    // --- SCANNER ---
    scanAd: async (url: string): Promise<any> => {
        const response = await fetch(`${API_URL}/scan-ad`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ url }),
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Falha ao escanear URL');
        }
        return response.json();
    },

    // --- AUTH ---
    login: async (email: string, password: string): Promise<{ access_token: string; refresh_token: string; user: User }> => {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Login failed');
        }
        return response.json();
    },

    register: async (email: string, password: string, name: string): Promise<{ access_token: string; refresh_token: string; user: User }> => {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name }),
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Registration failed');
        }
        return response.json();
    },

    refreshToken: async (token: string): Promise<{ access_token: string; refresh_token: string; user: User }> => {
        const response = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: token }),
        });
        if (!response.ok) throw new Error('Refresh failed');
        return response.json();
    },

    getMe: async (): Promise<User> => {
        const response = await fetch(`${API_URL}/me`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Unauthorized');
        return response.json();
    },

    getUsers: async (): Promise<User[]> => {
        const response = await fetch(`${API_URL}/users`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch users');
        return response.json();
    },

    checkHealth: async (): Promise<boolean> => {
        try {
            const res = await fetch(`${API_URL}/`);
            return res.ok;
        } catch (e) {
            return false;
        }
    },

    // --- BILLING ---
    createPixPayment: async (priceId?: string): Promise<{ transaction_id: string, qr_code_url: string, qr_code_text: string, expires_at: number, status: string }> => {
        // PriceId ignored, backend uses Admin Config. Kept param for type compat if needed.
        const response = await fetch(`${API_URL}/pay/pix`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ price_id: priceId || "ignored" }),
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Payment initialization failed');
        }
        return response.json();
    },

    checkPaymentStatus: async (txId: string): Promise<{ status: string }> => {
        const response = await fetch(`${API_URL}/pay/status/${txId}`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Status check failed');
        return response.json();
    },

    // --- ADMIN HUB CHECKOUT ---
    getAdminCheckoutSettings: async (): Promise<any> => {
        const response = await fetch(`${API_URL}/admin/checkout`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch admin settings');
        return response.json();
    },

    updateAdminCheckoutSettings: async (data: any): Promise<any> => {
        const response = await fetch(`${API_URL}/admin/checkout`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to update admin settings');
        return response.json();
    },

    getAdminTransactions: async (): Promise<any[]> => {
        const response = await fetch(`${API_URL}/admin/transactions`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch transactions');
        return response.json();
    },

    getPublicCheckoutConfig: async (): Promise<{ active: boolean, amount: number, currency: string }> => {
        const response = await fetch(`${API_URL}/checkout/public-config`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch public config');
        return response.json();
    }
};
