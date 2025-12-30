
import { Ad, AdStatus, Platform, Niche, CreativeType } from '../types';
import { INITIAL_ADS } from '../constants';
import { analyzeLibrary, LibraryIntelligence } from './intelligenceEngine';
import { api } from './api';

export const INTEL_KEY = 'adscale_library_intel';

export const dbService = {
  /**
   * Obtém anúncios do backend. Se vazio, seeda com iniciais.
   */
  getAds: async (): Promise<Ad[]> => {
    try {
      let ads = await api.getAds();
      // Seeding logic removed - Backend manages the data source.

      // Atualiza inteligência localmente (ou poderia ser no backend)
      const intel = analyzeLibrary(ads);
      localStorage.setItem(INTEL_KEY, JSON.stringify(intel));

      return ads;
    } catch (error) {
      console.error("Failed to fetch ads from API:", error);
      // Removed fallback to INITIAL_ADS to prevent old ads from appearing
      return [];
    }
  },

  getLibraryIntelligence: (): LibraryIntelligence | null => {
    const data = localStorage.getItem(INTEL_KEY);
    return data ? JSON.parse(data) : null;
  },

  // Novo método para atualização única
  updateAd: async (ad: Ad): Promise<void> => {
    try {
      await api.updateAd(ad.id, ad);
      window.dispatchEvent(new Event('databaseUpdated'));
    } catch (e) {
      console.error("Error updating ad:", e);
      throw e;
    }
  },

  // Novo método para criação única
  addAd: async (ad: Ad): Promise<void> => {
    try {
      await api.createAd(ad);
      window.dispatchEvent(new Event('databaseUpdated'));
    } catch (e) {
      console.error("Error adding ad:", e);
      throw e;
    }
  },

  // Novo método para deleção
  deleteAd: async (id: string): Promise<void> => {
    try {
      await api.deleteAd(id);
      window.dispatchEvent(new Event('databaseUpdated'));
    } catch (e) {
      console.error("Error deleting ad:", e);
      throw e;
    }
  },

  batchDeleteAds: async (ids: string[]): Promise<void> => {
    try {
      await api.batchDeleteAds(ids);
      window.dispatchEvent(new Event('databaseUpdated'));
    } catch (e) {
      console.error("Batch delete failed", e);
      throw e;
    }
  },

  clearAllAds: async (): Promise<void> => {
    try {
      await api.clearAllAds();
      window.dispatchEvent(new Event('databaseUpdated'));
    } catch (e) {
      console.error("Clear ads failed", e);
      throw e;
    }
  },

  // Batch update (parallel requests)
  batchUpdate: async (ads: Ad[]): Promise<void> => {
    try {
      await Promise.all(ads.map(ad => api.updateAd(ad.id, ad)));
      window.dispatchEvent(new Event('databaseUpdated'));
    } catch (e) {
      console.error("Batch update failed", e);
      throw e;
    }
  },

  // Importação Otimizada (Chunked)
  importAds: async (ads: Ad[]): Promise<void> => {
    try {
      const CHUNK_SIZE = 50; // Reduzido para garantir estabilidade com downloads
      const total = ads.length;

      console.log(`[dbService] Iniciando importação massiva de ${total} itens (Chunks de ${CHUNK_SIZE})...`);

      for (let i = 0; i < total; i += CHUNK_SIZE) {
        const chunk = ads.slice(i, i + CHUNK_SIZE);
        console.log(`[dbService] Enviando bloco ${Math.floor(i / CHUNK_SIZE) + 1} de ${Math.ceil(total / CHUNK_SIZE)}...`);
        await api.importAds(chunk);
      }

      console.log("[dbService] Importação concluída com sucesso!");
      window.dispatchEvent(new Event('databaseUpdated'));
    } catch (e) {
      console.error("[dbService] Import failed", e);
      throw e;
    }
  },

  // Deprecated/Compatibilidade: Apenas alerta se usado incorretamente
  // Mas para o CSV Wizard original, que passava a lista toda, vamos tentar ser espertos?
  // Na verdade, vamos refatorar o uso para usar methods acima.
  saveAds: async (ads: Ad[]) => {
    console.warn("dbService.saveAds is deprecated. Use updateAd, addAd or batchUpdate.");
  },

  quickAnalyze: (description: string, infoAds: string) => {
    const desc = (description || '').toLowerCase();
    const info = (infoAds || '').toLowerCase();
    let niche = Niche.BUSINESS;

    if (desc.includes('saúde') || desc.includes('dieta') || desc.includes('emagrecer') || desc.includes('fit')) niche = Niche.HEALTH;
    else if (desc.includes('dinheiro') || desc.includes('lucro') || desc.includes('investimento') || desc.includes('milhas')) niche = Niche.FINANCE;
    else if (desc.includes('aposta') || desc.includes('bet') || desc.includes('tiger') || desc.includes('cassino')) niche = Niche.BETTING;
    else if (desc.includes('loja') || desc.includes('frete') || desc.includes('comprar') || desc.includes('entrega')) niche = Niche.DROPSHIPPING;
    else if (desc.includes('curso') || desc.includes('mentor') || desc.includes('aula')) niche = Niche.EDUCATION;

    let escala = 1;
    const adMatch = info.match(/(\d+)/);
    if (adMatch) {
      const count = parseInt(adMatch[1]);
      escala = Math.min(10, Math.ceil(count / 15));
    }
    return { niche, escala };
  },

  calculateSaturation: (daysActive: number, adCount: number): number => {
    const timeFactor = Math.min(60, daysActive) / 60;
    const volumeFactor = Math.min(100, adCount) / 100;
    return Math.round((timeFactor * 0.7 + volumeFactor * 0.3) * 100);
  },

  calculateMomentumScore: (adCount: number, daysActive: number, history: number[] = []): number => {
    const velocity = adCount / Math.max(1, daysActive);
    let score = Math.min(10, velocity * 2);
    if (history.length > 1) {
      const trend = adCount - history[history.length - 2];
      if (trend < 0) score *= 0.5;
      else if (trend > 10) score *= 1.3;
    }
    return parseFloat(Math.min(10, score).toFixed(1));
  },

  detectRegion: (data: { infoAds?: string, text?: string }) => {
    let region = { country: "Brasil", flag: "🇧🇷", code: "BR" };
    let inferredByAI = false;
    let isDefault = true;

    // 1. Tentar extrair do campo "Info Ads" se explícito (ex: "12 ads Brazil")
    if (data.infoAds) {
      const match = data.infoAds.toString().match(/(\d+)\s*ads?\s*(.*)/i);
      if (match && match[2] && match[2].length > 2) {
        const rawCountry = match[2].trim().toLowerCase();
        if (rawCountry.includes('brazil') || rawCountry.includes('brasil')) { region = { country: "Brasil", flag: "🇧🇷", code: "BR" }; isDefault = false; }
        else if (rawCountry.includes('united states') || rawCountry.includes('usa') || rawCountry.includes('us')) { region = { country: "Estados Unidos", flag: "🇺🇸", code: "US" }; isDefault = false; }
        else if (rawCountry.includes('united kingdom') || rawCountry.includes('uk')) { region = { country: "Reino Unido", flag: "🇬🇧", code: "GB" }; isDefault = false; }
        else if (rawCountry.includes('py') || rawCountry.includes('paraguay')) { region = { country: "Paraguai", flag: "🇵🇾", code: "PY" }; isDefault = false; }
        else if (rawCountry.includes('colombia')) { region = { country: "Colômbia", flag: "🇨🇴", code: "CO" }; isDefault = false; }
        else if (rawCountry.includes('portugal')) { region = { country: "Portugal", flag: "🇵🇹", code: "PT" }; isDefault = false; }
        else if (rawCountry.includes('france')) { region = { country: "França", flag: "🇫🇷", code: "FR" }; isDefault = false; }
        else if (rawCountry.includes('germany')) { region = { country: "Alemanha", flag: "🇩🇪", code: "DE" }; isDefault = false; }
        else if (rawCountry.includes('spain')) { region = { country: "Espanha", flag: "🇪🇸", code: "ES" }; isDefault = false; }
      }
    }

    // 2. Inferência por Texto (Muito mais forte agora)
    // Se ainda for default (Brasil) ou se quisermos validar duplamente
    if (data.text) {
      const text = data.text.toLowerCase();

      // Dicionários expandidos
      const enTerms = ['the', 'and', 'to', 'shipping', 'free', 'shop', 'now', 'get', 'buy', 'off', 'sale', 'order', 'best', 'new', 'limited', 'deal', 'quality', 'check', 'out', 'click', 'link', 'today', 'worldwide', 'save', 'more'];
      const ptTerms = ['o', 'a', 'e', 'de', 'do', 'da', 'frete', 'grátis', 'saiba', 'mais', 'comprar', 'loja', 'oferta', 'hoje', 'melhor', 'qualidade', 'clique', 'link', 'compra', 'envio', 'para', 'com', 'você', 'seu', 'sua'];
      const esTerms = ['el', 'la', 'y', 'en', 'con', 'envío', 'gratis', 'comprar', 'tienda', 'oferta', 'hoy', 'mejor', 'calidad', 'clic', 'enlace', 'compra', 'para', 'usted', 'su', 'ahora', 'mas', 'descubre'];

      const countMatches = (terms: string[]) => terms.reduce((acc, term) => acc + (text.split(new RegExp(`\\b${term}\\b`)).length - 1), 0);

      const enScore = countMatches(enTerms);
      const ptScore = countMatches(ptTerms);
      const esScore = countMatches(esTerms);

      console.log(`[RegionDetect] EN:${enScore} PT:${ptScore} ES:${esScore} | Text: "${text.substring(0, 30)}..."`);

      // Lógica de desempate
      if (enScore > ptScore && enScore > esScore) {
        region = { country: "Estados Unidos", flag: "🇺🇸", code: "US" };
        inferredByAI = true;
      } else if (esScore > ptScore && esScore > enScore) {
        region = { country: "Global (Esp)", flag: "🌎", code: "ES" };
        inferredByAI = true;
      } else if (ptScore > enScore && ptScore > esScore) {
        // Mantém Brasil mas marca como inferido
        region = { country: "Brasil", flag: "🇧🇷", code: "BR" };
        inferredByAI = true;
      }
    }

    return { region, inferredByAI };
  },

  reprocessRegions: async () => {
    try {
      const allAds = await dbService.getAds();
      const adsToUpdate: Ad[] = [];

      for (const ad of allAds) {
        const currentCode = ad.targeting?.locations?.[0]?.code || 'UNKNOWN';

        // Re-run Region Detection
        const { region, inferredByAI } = dbService.detectRegion({
          infoAds: `${ad.adCount} ads`,
          text: (ad.copy || '') + ' ' + (ad.title || '')
        });

        // Re-evaluate Scaling Status & Rating based on AdCount
        // Logic: >30 ads = Scaling, >10 = Validated, else Testing
        let newStatus = ad.status;
        if (ad.adCount >= 30) newStatus = AdStatus.SCALING;
        else if (ad.adCount >= 10) newStatus = AdStatus.VALIDATED;
        else newStatus = AdStatus.TESTING; // Explicitly set to TESTING if neither SCALING nor VALIDATED

        const newRating = Math.min(5, 3 + (ad.adCount / 50));

        // Performance Update
        const newMomentum = [10, 20, 30, 40, ad.adCount]; // Simple curve based on current count

        // Update if ANY significant field changed (Region, Status, or Rating mismatch)
        const regionChanged = currentCode !== region.code && (currentCode !== 'UNKNOWN' || region.code !== 'BR');
        const statusChanged = ad.status !== newStatus;
        const ratingChanged = Math.abs((ad.rating || 0) - newRating) > 0.5; // Check for significant rating change

        if (regionChanged || statusChanged || ratingChanged) {
          adsToUpdate.push({
            ...ad,
            status: newStatus,
            rating: newRating,
            targeting: {
              ...ad.targeting,
              locations: [{ country: region.country, flag: region.flag, volume: ad.adCount * 100, code: region.code }]
            },
            tags: [
              ...(ad.tags || []).filter(t => t !== 'IA Detect' && t !== 'Escala Pesada' && t !== 'Validado' && t !== 'Teste'),
              inferredByAI ? "IA Detect" : "Meta Data",
              ad.adCount > 50 ? "Escala Pesada" : (ad.adCount > 10 ? "Validado" : "Teste")
            ],
            insights: `Região: ${region.country}. Status recalculado: ${newStatus} (${ad.adCount} ativos).`,
            performance: {
              ...ad.performance,
              estimatedCpc: region.code === 'US' ? 1.50 : 0.50,
              estimatedSpend: region.code === 'US' ? "$ 2k+" : "R$ 5k+",
              momentum: newMomentum,
              saturationLevel: dbService.calculateSaturation(ad.performance.daysActive, ad.adCount),
              momentumScore: dbService.calculateMomentumScore(ad.adCount, ad.performance.daysActive, ad.performance.momentum)
            },
            techStack: {
              ...ad.techStack,
              serverCountry: region.country
            }
          });
        }
      }

      if (adsToUpdate.length > 0) {
        console.log(`Reprocessando inteligência: ${adsToUpdate.length} anúncios atualizados.`);

        // Sequencial com delay para não sobrecarregar backend SQLite
        for (let i = 0; i < adsToUpdate.length; i++) {
          const ad = adsToUpdate[i];
          await api.updateAd(ad.id, ad);
          console.log(`Atualizado ${i + 1}/${adsToUpdate.length}: ${ad.title} -> ${ad.targeting.locations[0].country}`);
          // Pequeno delay
          await new Promise(r => setTimeout(r, 200));
        }

        window.dispatchEvent(new Event('databaseUpdated'));
      }
      return adsToUpdate.length;
    } catch (e) {
      console.error("Erro ao reprocessar regiões", e);
      throw e;
    }
  },

  mapRowToAd: (row: any, analysis: { niche: Niche; escala: number }): Ad => {
    const getVal = (possibleKeys: string[]) => {
      const key = Object.keys(row).find(k => possibleKeys.includes(k.toLowerCase().trim()));
      return key ? row[key] : undefined;
    };

    const id = getVal(['id', 'id ad', 'uuid', 'identificador']) || `as_${Math.random().toString(36).substr(2, 9)}`;
    const brandName = getVal(['página', 'anunciante', 'page', 'brand', 'name', 'título', 'nome', 'marca']) || 'Sinal Desconhecido';
    const description = getVal(['descrição', 'copy', 'text', 'texto', 'body', 'anúncio', 'creative text']) || '';
    const mediaUrl = (row.customImage && row.customImage.length > 10)
      ? row.customImage
      : (getVal(['url criativo', 'image_url', 'media', 'link imagem', 'creative url', 'thumbnail', 'video_url', 'media_url', 'creative_url', 'link', 'img_url', 'video url', 'link video', 'creative_media']) || '');
    const infoAds = getVal(['info ads', 'active ads', 'anúncios ativos', 'count', 'quantidade']) || '1';

    // --- LÓGICA DE DETECÇÃO DE REGIÃO E ESCALA ---
    // Refactored to use helper
    const { region, inferredByAI } = dbService.detectRegion({ infoAds, text: description + ' ' + brandName });

    let adCount = 1;

    // Extrair adCount do infoAds novamente pois o helper só retorna a região
    if (infoAds) {
      const match = infoAds.toString().match(/(\d+)/);
      if (match) adCount = parseInt(match[1]);
      else adCount = parseInt(infoAds) || (analysis.escala * 12);
    } else {
      adCount = (analysis.escala * 12);
    }
    // ------------------------------------------------

    const ticket = getVal(['ticket', 'preço', 'price', 'valor', 'ticket médio']) || 'Consultar';
    const funnel = getVal(['funil', 'funnel', 'mecanismo', 'estratégia']) || 'Direto';
    const salesPage = getVal(['url destino', 'página vendas', 'sales page', 'destination url', 'landing page', 'link de destino']) || '#';
    const library = getVal(['url biblioteca', 'library url', 'facebook library', 'link biblioteca', 'ad library url']) || '#';

    const daysActive = parseInt(getVal(['dias ativos', 'days active', 'running for', 'dias', 'days', 'tempo rodando']) || '1');
    const displayUrl = getVal(['display url', 'site', 'domínio', 'url']) || salesPage;
    const tld = displayUrl.includes('.') ? '.' + displayUrl.split('.').pop()?.split('/')[0].split('?')[0] : '.com';

    return {
      id,
      title: brandName,
      brandId: brandName.toLowerCase().replace(/\s+/g, '_'),
      brandLogo: `https://ui-avatars.com/api/?name=${encodeURIComponent(brandName)}&background=020617&color=fff&bold=true`,
      platform: Platform.META,
      niche: analysis.niche,
      type: mediaUrl.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || mediaUrl.toLowerCase().includes('video') || mediaUrl.includes('blob:') ? CreativeType.VSL : CreativeType.DIRECT,
      status: adCount > 30 ? AdStatus.SCALING : AdStatus.VALIDATED,
      tags: [analysis.niche, adCount > 50 ? "Escala Pesada" : "Validado", inferredByAI ? "IA Detect" : "Meta Data"],
      thumbnail: mediaUrl,
      mediaUrl: mediaUrl,
      mediaHash: `AS-${id.toString().slice(-4).toUpperCase()}`,
      copy: description,
      cta: getVal(['cta', 'botão', 'action', 'chamada']) || "Saiba Mais",
      insights: `Análise AdScale: Este sinal apresenta um volume de ${adCount} ativos na região: ${region.country}.`,
      rating: Math.min(5, 3 + (adCount / 50)),
      addedAt: new Date().toISOString(),
      adCount,
      ticketPrice: ticket,
      funnelType: funnel,
      salesPageUrl: salesPage,
      checkoutUrl: getVal(['checkout', 'url checkout', 'link checkout', 'checkout url']) || "#",
      libraryUrl: library,
      pixels: [], // Default empty array
      tld: tld,
      performance: {
        estimatedCtr: 2.5,
        estimatedCpc: region.code === 'US' ? 1.50 : 0.50, // CPC maior para US
        daysActive: daysActive,
        successProbability: 80,
        estimatedSpend: region.code === 'US' ? "$ 2k+" : "R$ 5k+",
        cloakerDetected: false,
        momentum: [10, 20, 30, 40, adCount],
        saturationLevel: dbService.calculateSaturation(daysActive, adCount),
        momentumScore: dbService.calculateMomentumScore(adCount, daysActive, [10, 20, 30, 40, adCount])
      },
      siteTraffic: { monthlyVisits: "N/A", topSource: "Paid Ads", deviceSplit: { mobile: 95, desktop: 5 } },
      techStack: { ecommercePlatform: "Monitorada", trackingPixels: ["FB"], serverCountry: region.country },
      targeting: { gender: "Todos", ageRange: "25-55", locations: [{ country: region.country, flag: region.flag, volume: adCount * 100, code: region.code }] }
    };
  }
};
