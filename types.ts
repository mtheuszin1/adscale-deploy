
export enum Platform {
  META = 'Meta Ads',
  TIKTOK = 'TikTok Ads',
  GOOGLE = 'Google Ads'
}

export enum Niche {
  HEALTH = 'Saúde & Bem-estar',
  FINANCE = 'Finanças & Milhas',
  BETTING = 'Apostas',
  DROPSHIPPING = 'Dropshipping',
  INFOPRODUCTS = 'Info-produtos',
  REAL_ESTATE = 'Imobiliário',
  EDUCATION = 'Educacao & Carreira',
  SPIRITUALITY = 'Espiritualidade',
  FASHION = 'Moda & Estética',
  BUSINESS = 'Negócios & SaaS',
  ENTERTAINMENT = 'Lazer & Entretenimento'
}

export enum CreativeType {
  UGC = 'UGC',
  VSL = 'VSL',
  DIRECT = 'Criativo Direto',
  STORYTELLING = 'Storytelling'
}

export enum AdStatus {
  TESTING = 'Teste',
  SCALING = 'Escalando',
  VALIDATED = 'Validado'
}

export interface Ad {
  id: string;
  title: string;
  brandId: string;
  brandLogo: string;
  platform: Platform;
  niche: Niche;
  type: CreativeType;
  status: AdStatus;
  tags: string[];
  thumbnail: string;
  mediaUrl: string;
  mediaHash: string;
  copy: string;
  cta: string;
  insights: string;
  rating: number;
  addedAt: string;
  adCount: number;
  ticketPrice: string;
  funnelType: string;
  salesPageUrl: string;
  checkoutUrl: string;
  libraryUrl: string;
  isFeatured?: boolean; // Controle administrativo de destaque
  displayOrder?: number; // Ordem manual de exibição
  isVisible?: boolean; // Visibilidade global
  performance: {
    estimatedCtr: number;
    estimatedCpc: number;
    daysActive: number;
    successProbability: number;
    estimatedSpend: string;
    cloakerDetected: boolean;
    momentum: number[];
  };
  siteTraffic: {
    monthlyVisits: string;
    topSource: string;
    deviceSplit: { mobile: number; desktop: number };
  };
  techStack: {
    ecommercePlatform: string;
    trackingPixels: string[];
    serverCountry: string;
  };
  targeting: {
    gender: string;
    ageRange: string;
    locations: AdLocation[];
  };
  forensicData?: {
    lastSeen: string;
    firstSeen: string;
    highestActiveAds: number;
    highestActiveDate: string;
  };
}

export interface PlatformSettings {
  siteName: string;
  siteLogo: string;
  supportEmail: string;
  maintenanceMode: boolean;
  socialLinks: {
    instagram: string;
    youtube: string;
    whatsapp: string;
  };
  defaultLanguage: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  subscriptionActive: boolean;
  subscriptionPlan?: 'monthly' | 'yearly';
  nextBillingDate?: string;
  paymentMethod?: 'stripe' | 'pix' | 'kirvano';
  favorites: string[];
  createdAt?: string;
}

export interface AdLocation {
  country: string;
  flag: string;
  volume: number;
  code?: string;
}

export interface SystemConfig {
  gateways: {
    stripe: boolean;
    pix: boolean;
    kirvano: boolean;
  };
}
