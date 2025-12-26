
import { PlatformSettings } from '../types';

const SETTINGS_KEY = 'adscale_platform_settings';

const DEFAULT_SETTINGS: PlatformSettings = {
  siteName: 'ADSCALE',
  siteLogo: 'AS',
  supportEmail: 'suporte@adscale.io',
  maintenanceMode: false,
  socialLinks: {
    instagram: 'https://instagram.com/adscale',
    youtube: 'https://youtube.com/adscale',
    whatsapp: 'https://wa.me/5511999999999'
  },
  defaultLanguage: 'pt-BR'
};

export const platformService = {
  getSettings: (): PlatformSettings => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  },

  updateSettings: (settings: PlatformSettings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event('platformSettingsUpdated'));
  }
};
