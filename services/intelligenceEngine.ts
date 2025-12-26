
import { Ad, Platform, AdStatus } from '../types';

export interface PlatformInsight {
  platform: Platform;
  avgCtrAll: number;
  avgCtrScaling: number;
  avgDaysActiveScaling: number;
  avgAdCountScaling: number;
  scalingRate: number; 
  totalAds: number;
  efficiencyIndex: number; // Relação entre longevidade e adCount
}

export interface LibraryIntelligence {
  globalStats: {
    totalAds: number;
    scalingPercentage: number;
    survivalDistribution: {
      infantMortality: number; // < 5 dias
      validated: number;       // 5-15 dias
      legacy: number;          // > 15 dias
    };
  };
  platformInsights: Record<Platform, PlatformInsight>;
  ticketInsights: {
    avgTicketScaling: number;
    mostSuccessfulRange: { min: number; max: number };
  };
  timeInsights: {
    avgTimeToScale: number; // Média de dias antes de atingir status SCALING
    survivalThreshold: number; // Dias mínimos para ser estatisticamente relevante
  };
  falsePositivePatterns: {
    clickbaitThresholds: Record<Platform, number>;
    hypeAdsDetected: number;
  };
  baselines: Record<Platform, {
    minCtrForScale: number;
    minDaysForScale: number;
    minAdCountForScale: number;
    suspiciousCtrLimit: number; // CTR acima disso sem longevidade = Alerta
  }>;
  lastAnalysis: string;
}

/**
 * COLLECTIVE INTELLIGENCE SCRIPT
 * Desenvolvido para analisar a biblioteca como um todo e gerar baselines de mercado interno.
 */
export const analyzeLibrary = (ads: Ad[]): LibraryIntelligence => {
  const totalAds = ads.length;
  if (totalAds === 0) throw new Error("Database empty: Analysis aborted.");

  // Agregadores Temporários
  const platformStats: Record<string, any> = {};
  const survivalBuckets = { infant: 0, validated: 0, legacy: 0 };
  const ticketValues: number[] = [];
  let totalHypeDetected = 0;
  let totalDaysToScale = 0;
  let countToScale = 0;

  // Inicialização por Plataforma
  Object.values(Platform).forEach(p => {
    platformStats[p] = {
      count: 0,
      sumCtr: 0,
      scaling: {
        count: 0,
        sumCtr: 0,
        sumDays: 0,
        sumAdCount: 0
      }
    };
  });

  // SINGLE PASS ANALYSIS O(n)
  ads.forEach(ad => {
    const p = ad.platform;
    const ctr = ad.performance.estimatedCtr;
    const days = ad.performance.daysActive;
    const count = ad.adCount;
    const isScaling = ad.status === AdStatus.SCALING;

    // 1. Agregação de Plataforma
    platformStats[p].count++;
    platformStats[p].sumCtr += ctr;

    if (isScaling) {
      platformStats[p].scaling.count++;
      platformStats[p].scaling.sumCtr += ctr;
      platformStats[p].scaling.sumDays += days;
      platformStats[p].scaling.sumAdCount += count;
      
      // Tracking de tempo para escala
      totalDaysToScale += days;
      countToScale++;

      // Extração de Ticket (Lógica Econômica)
      const ticketVal = parseFloat(ad.ticketPrice.replace(/[^\d.,]/g, '').replace(',', '.'));
      if (!isNaN(ticketVal)) ticketValues.push(ticketVal);
    }

    // 2. Distribuição de Sobrevivência
    if (days < 5) survivalBuckets.infant++;
    else if (days <= 15) survivalBuckets.validated++;
    else survivalBuckets.legacy++;

    // 3. Detecção de Falsos Positivos (Hype Pattern)
    // Se CTR é muito superior à média da plataforma mas o anúncio é novo e sem volume
    // No loop inicial não temos a média, então usamos heurísticas baseadas em regras de mercado
    const platformHypeLimit = p === Platform.TIKTOK ? 7 : 5; 
    if (ctr > platformHypeLimit && days < 4 && count < 3) {
      totalHypeDetected++;
    }
  });

  // CÁLCULOS DE INSIGHTS E BASELINES
  const platformInsights: any = {};
  const finalBaselines: any = {};

  Object.values(Platform).forEach(p => {
    const s = platformStats[p];
    const scalingCount = s.scaling.count || 1;
    const totalCount = s.count || 1;

    const avgScalingCtr = s.scaling.sumCtr / scalingCount;
    const avgScalingDays = s.scaling.sumDays / scalingCount;
    const avgScalingAdCount = s.scaling.sumAdCount / scalingCount;

    platformInsights[p] = {
      platform: p,
      avgCtrAll: s.sumCtr / totalCount,
      avgCtrScaling: avgScalingCtr,
      avgDaysActiveScaling: avgScalingDays,
      avgAdCountScaling: avgScalingAdCount,
      scalingRate: (s.scaling.count / totalCount) * 100,
      totalAds: s.count,
      efficiencyIndex: (avgScalingAdCount * avgScalingDays) / 100
    };

    // Geração de Baselines Dinâmicos
    finalBaselines[p] = {
      minCtrForScale: avgScalingCtr * 0.85, // 85% da média de quem está escalando
      minDaysForScale: Math.max(3, Math.floor(avgScalingDays * 0.6)),
      minAdCountForScale: Math.max(5, Math.floor(avgScalingAdCount * 0.4)),
      suspiciousCtrLimit: avgScalingCtr * 2.2 // Mais que o dobro do normal é sinal de clickbait
    };
  });

  return {
    globalStats: {
      totalAds,
      scalingPercentage: (countToScale / totalAds) * 100,
      survivalDistribution: {
        infantMortality: (survivalBuckets.infant / totalAds) * 100,
        validated: (survivalBuckets.validated / totalAds) * 100,
        legacy: (survivalBuckets.legacy / totalAds) * 100
      }
    },
    platformInsights,
    ticketInsights: {
      avgTicketScaling: ticketValues.length ? ticketValues.reduce((a, b) => a + b, 0) / ticketValues.length : 0,
      mostSuccessfulRange: {
        min: ticketValues.length ? Math.min(...ticketValues) : 0,
        max: ticketValues.length ? Math.max(...ticketValues) : 0
      }
    },
    timeInsights: {
      avgTimeToScale: countToScale ? totalDaysToScale / countToScale : 7,
      survivalThreshold: 5 // Média de mercado para relevância
    },
    falsePositivePatterns: {
      /* Added type assertion to cast generic object from entries back to Record<Platform, number> */
      clickbaitThresholds: Object.fromEntries(
        Object.entries(finalBaselines).map(([k, v]: [string, any]) => [k, v.suspiciousCtrLimit])
      ) as Record<Platform, number>,
      hypeAdsDetected: totalHypeDetected
    },
    baselines: finalBaselines,
    lastAnalysis: new Date().toISOString()
  };
};

/**
 * SCORING CONTEXTUAL (Aplica a inteligência da biblioteca no anúncio individual)
 * Substitui valores hardcoded pela realidade da biblioteca.
 */
export const calculateContextualScore = (ad: Ad, intelligence: LibraryIntelligence): number => {
  const baseline = intelligence.baselines[ad.platform];
  const insight = intelligence.platformInsights[ad.platform];
  
  let score = 50; // Início Neutro

  // 1. Análise de CTR vs Baseline Real da Biblioteca
  if (ad.performance.estimatedCtr > baseline.minCtrForScale) score += 20;
  else if (ad.performance.estimatedCtr < insight.avgCtrAll) score -= 15;

  // 2. Detecção de Clickbait (Penalidade)
  if (ad.performance.estimatedCtr > baseline.suspiciousCtrLimit && ad.performance.daysActive < 4) {
    score -= 30; // Reduz drasticamente se parecer clickbait
  }

  // 3. Validação por Longevidade
  if (ad.performance.daysActive > baseline.minDaysForScale) score += 15;
  /* Added parentheses to fix operator precedence error where > was applied to boolean and number */
  if (ad.performance.daysActive > (intelligence.globalStats.totalAds > 10 ? 15 : 10)) score += 10;

  // 4. Intenção de Escala (Volume de Ads)
  if (ad.adCount > baseline.minAdCountForScale) score += 25;
  if (ad.adCount > insight.avgAdCountScaling) score += 10;

  return Math.min(100, Math.max(0, score));
};
