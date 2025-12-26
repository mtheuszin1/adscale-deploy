
import { SystemConfig } from '../types';

const CONFIG_KEY = 'adscale_system_config';

export const financeService = {
  getConfig: (): SystemConfig => {
    const saved = localStorage.getItem(CONFIG_KEY);
    if (saved) return JSON.parse(saved);
    return {
      gateways: {
        stripe: true,
        pix: true,
        kirvano: false
      }
    };
  },

  updateGateway: async (gateway: 'stripe' | 'pix' | 'kirvano', active: boolean): Promise<boolean> => {
    // Simulando chamada de API para o backend
    return new Promise((resolve) => {
      setTimeout(() => {
        const config = financeService.getConfig();
        config.gateways[gateway] = active;
        localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
        
        // Disparar evento para atualização em tempo real na UI
        window.dispatchEvent(new CustomEvent('gatewayUpdated', { detail: { gateway, active } }));
        resolve(true);
      }, 800);
    });
  },

  getRevenueMetrics: async () => {
    // Simulated endpoint for real-time revenue metrics
    return {
      mrr: Math.floor(Math.random() * 5000) + 15000,
      activeUsers: Math.floor(Math.random() * 100) + 1200,
      churnRate: '2.4%',
      transactionsToday: Math.floor(Math.random() * 50) + 10
    };
  },

  simulateWebhook: (userId: string, plan: 'monthly' | 'yearly', method: string) => {
    // Simula o recebimento de um postback que confirma o pagamento
    const userStr = localStorage.getItem('adscale_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.id === userId) {
        user.subscriptionActive = true;
        user.subscriptionPlan = plan;
        user.paymentMethod = method;
        user.nextBillingDate = new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString();
        localStorage.setItem('adscale_user', JSON.stringify(user));
        
        // Notificar o App
        window.dispatchEvent(new Event('subscriptionUpdated'));
        return true;
      }
    }
    return false;
  }
};
