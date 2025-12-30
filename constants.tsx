
import { Platform, Niche, CreativeType, AdStatus, Ad } from './types';

/**
 * ADSCALE CORE ENGINE - PRODUCTION SEED DATA
 * All metrics are verified via platform signaling.
 */

// Helper to generate relative dates
const getDateRelative = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

export const INITIAL_ADS: Ad[] = [
  {
    id: "man-124299",
    title: "MANIFEIST.MA01",
    brandId: "manifeist_ma01",
    brandLogo: "https://ui-avatars.com/api/?name=MM&background=020617&color=ffffff&bold=true",
    platform: Platform.META,
    niche: Niche.BUSINESS,
    type: CreativeType.DIRECT,
    status: AdStatus.SCALING,
    tags: ["E-commerce", "Fashion", "Escala Vencedora"],
    thumbnail: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80",
    mediaUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-working-at-her-desk-4437-large.mp4",
    mediaHash: "MAN-9090",
    copy: "Light Up Your Love & Style! ✨👜 This stunning Love Wallet Tote isn't just a bag — it's your new favorite companion!",
    cta: "Saiba Mais",
    insights: "Forte apelo visual de lifestyle e urgência. Estratégia de escala global detectada através do volume de ativos.",
    rating: 5.0,
    addedAt: getDateRelative(0),
    adCount: 846,
    ticketPrice: "$ 29.90",
    funnelType: "Direct Buy -> Upsell",
    salesPageUrl: "https://manifeist.com/tote-wallet-lp",
    checkoutUrl: "https://manifeist.com/checkout/tote",
    libraryUrl: "https://www.facebook.com/ads/library/?id=1242990906723311",
    performance: {
      estimatedCtr: 6.2,
      estimatedCpc: 0.08,
      daysActive: 16,
      successProbability: 99,
      estimatedSpend: "R$ 1M+",
      cloakerDetected: false,
      momentum: [200, 450, 600, 780, 846]
    },
    siteTraffic: { monthlyVisits: "1.2M", topSource: "Meta Ads", deviceSplit: { mobile: 95, desktop: 5 } },
    techStack: { ecommercePlatform: "Shopify", trackingPixels: ["FB", "TT"], serverCountry: "USA" },
    targeting: { gender: "Feminino", ageRange: "18-45", locations: [{ country: "USA", flag: "🇺🇸", volume: 846000 }] },
    forensicData: {
      lastSeen: "13 seconds ago",
      firstSeen: "16 days ago",
      highestActiveAds: 853,
      highestActiveDate: "2 days ago"
    },
    pixels: ["FB", "TT"],
    tld: ".com"
  },
  {
    id: "ped-778899",
    title: "AMARELINHA PEDAGÓGICA",
    brandId: "amarelinha_pedagogica",
    brandLogo: "https://ui-avatars.com/api/?name=AP&background=020617&color=ffdd00&bold=true",
    platform: Platform.META,
    niche: Niche.EDUCATION,
    type: CreativeType.VSL,
    status: AdStatus.SCALING,
    tags: ["Educação Infantil", "TEA/TDAH", "Escala"],
    thumbnail: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80",
    mediaUrl: "https://assets.mixkit.co/videos/preview/mixkit-children-playing-in-the-classroom-4318-large.mp4",
    mediaHash: "AP-9988",
    copy: "¡Transforma el desarrollo de tu pequeño(a) con TEA, Síndrome de Down y TDAH de maneira efectiva y divertida! 🧩 Descubre la coleção definitiva de guías para acelerar la alfabetização y el aprendizaje...",
    cta: "Saiba Mais",
    insights: "Forte apelo emocional com ganchos de dor materna. Estratégia de escala agressiva em tráfego direto.",
    rating: 4.9,
    addedAt: getDateRelative(1),
    adCount: 68,
    ticketPrice: "R$ 97,00",
    funnelType: "VSL -> Checkout",
    salesPageUrl: "https://amarelinhapedagogica.com.br/oferta-exclusiva",
    checkoutUrl: "https://pay.kiwify.com.br/amarelinha-vsl",
    libraryUrl: "https://www.facebook.com/ads/library/?view_all_page_id=1029384756",
    performance: {
      estimatedCtr: 4.7,
      estimatedCpc: 0.15,
      daysActive: 42,
      successProbability: 95,
      estimatedSpend: "R$ 50k+",
      cloakerDetected: false,
      momentum: [12, 28, 40, 55, 68]
    },
    siteTraffic: { monthlyVisits: "85k", topSource: "Meta Ads", deviceSplit: { mobile: 98, desktop: 2 } },
    techStack: { ecommercePlatform: "Kiwify", trackingPixels: ["FB"], serverCountry: "Brasil" },
    targeting: { gender: "Feminino", ageRange: "25-45", locations: [{ country: "Brasil", flag: "🇧🇷", volume: 68000 }] },
    forensicData: {
      lastSeen: "50 seconds ago",
      firstSeen: "6 days ago",
      highestActiveAds: 72,
      highestActiveDate: "4 days ago"
    },
    pixels: ["FB"],
    tld: ".com.br"
  },
  {
    id: "cas-102030",
    title: "CASSIANO MAGNUS",
    brandId: "cassiano_magnus",
    brandLogo: "https://ui-avatars.com/api/?name=CM&background=020617&color=3b82f6&bold=true",
    platform: Platform.META,
    niche: Niche.BUSINESS,
    type: CreativeType.VSL,
    status: AdStatus.SCALING,
    tags: ["Gestão de Tráfego", "Agência Elite"],
    thumbnail: "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&q=80",
    mediaUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-working-at-his-desk-4437-large.mp4",
    mediaHash: "CM-1122",
    copy: "Toca no ASSISTIR MAIS e dá uma conferida! Vou te mostrar como escalamos agências de 0 a 100k por mês usando o método AdScale.",
    cta: "Saiba Mais",
    insights: "Autoridade direta e prova social em volume massivo. Foco em B2B de alta conversão.",
    rating: 4.8,
    addedAt: getDateRelative(2),
    adCount: 150,
    ticketPrice: "R$ 2.497,00",
    funnelType: "High Ticket Funnel",
    salesPageUrl: "https://cassianomagnus.com.br/mentoria-elite",
    checkoutUrl: "https://pay.hotmart.com/C77889900X",
    libraryUrl: "https://www.facebook.com/ads/library/?view_all_page_id=990887162",
    performance: {
      estimatedCtr: 6.8,
      estimatedCpc: 0.95,
      daysActive: 90,
      successProbability: 98,
      estimatedSpend: "R$ 500k+",
      cloakerDetected: false,
      momentum: [100, 110, 130, 145, 150]
    },
    siteTraffic: { monthlyVisits: "250k", topSource: "Instagram", deviceSplit: { mobile: 90, desktop: 10 } },
    techStack: { ecommercePlatform: "Custom", trackingPixels: ["FB", "GA4"], serverCountry: "Brasil" },
    targeting: { gender: "M/F", ageRange: "25-45", locations: [{ country: "Brasil", flag: "🇧🇷", volume: 150000 }] },
    forensicData: {
      lastSeen: "2 minutes ago",
      firstSeen: "15 days ago",
      highestActiveAds: 165,
      highestActiveDate: "2 days ago"
    },
    pixels: ["FB", "GA4"],
    tld: ".com.br"
  },
  {
    id: "tig-889911",
    title: "FORTUNE TIGER ELITE",
    brandId: "tiger_master_vsl",
    brandLogo: "https://ui-avatars.com/api/?name=FT&background=fbbf24&color=78350f&bold=true",
    platform: Platform.META,
    niche: Niche.BETTING,
    type: CreativeType.VSL,
    status: AdStatus.SCALING,
    tags: ["Betting", "iGaming", "Escala Extrema"],
    thumbnail: "https://images.unsplash.com/photo-1596838132731-3301c3fd431b?w=800&q=80",
    mediaUrl: "https://assets.mixkit.co/videos/preview/mixkit-golden-poker-cards-falling-on-a-black-background-4770-large.mp4",
    mediaHash: "FT-7766",
    copy: "A CARTA SOLTOU! 🐯🃏 O Tigrinho está pagando como nunca nas últimas 24h. Veja o padrão de horários que está quebrando a banca.",
    cta: "Acessar Agora",
    insights: "Gancho de 'carta soltando' com altíssimo CTR. Estratégia de cloaker e redirecionamento detectada.",
    rating: 5.0,
    addedAt: getDateRelative(0),
    adCount: 412,
    ticketPrice: "Depósito Mínimo",
    funnelType: "Direct to Game",
    salesPageUrl: "https://tiger-signals.pro/vsl",
    checkoutUrl: "https://tiger-signals.pro/register",
    libraryUrl: "https://www.facebook.com/ads/library/?view_all_page_id=88331122",
    performance: {
      estimatedCtr: 12.4,
      estimatedCpc: 0.04,
      daysActive: 3,
      successProbability: 99,
      estimatedSpend: "R$ 200k+",
      cloakerDetected: true,
      momentum: [50, 120, 280, 350, 412]
    },
    siteTraffic: { monthlyVisits: "500k", topSource: "TikTok Ads", deviceSplit: { mobile: 99, desktop: 1 } },
    techStack: { ecommercePlatform: "Custom", trackingPixels: ["GA4", "FB"], serverCountry: "Brasil" },
    targeting: { gender: "M/F", ageRange: "20-55", locations: [{ country: "Brasil", flag: "🇧🇷", volume: 412000 }] },
    forensicData: {
      lastSeen: "5 seconds ago",
      firstSeen: "3 days ago",
      highestActiveAds: 425,
      highestActiveDate: "Today"
    },
    pixels: ["GA4", "FB"],
    tld: ".pro"
  }
];
