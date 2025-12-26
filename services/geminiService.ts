import { GoogleGenAI, Type } from "@google/genai";
import { Niche } from "../types";

export async function generateAdInsights(title: string, niche: string, copy: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analise este anúncio para uma biblioteca de inteligência de anúncios. 
      Título: ${title}
      Nicho: ${niche}
      Copy: ${copy}
      
      Forneça uma análise estratégica curta (máximo 200 caracteres) explicando por que este anúncio funciona e quais gatilhos mentais foram usados.`,
      config: {
        temperature: 0.7
      }
    });

    return response.text || "Sem insights gerados automaticamente.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erro ao gerar insights via IA.";
  }
}

export async function detectNiche(description: string): Promise<Niche> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Com base no texto do anúncio abaixo, responda apenas com uma palavra qual é o nicho (Ex: Saúde, Ganhar Dinheiro, Relacionamento, Apostas, E-commerce): ${description}`,
      config: {
        temperature: 0.1
      }
    });

    const result = (response.text || "").trim().toLowerCase();
    
    if (result.includes('saúde') || result.includes('saude') || result.includes('fit')) return Niche.HEALTH;
    if (result.includes('ganhar') || result.includes('dinheiro') || result.includes('milhas') || result.includes('finança')) return Niche.FINANCE;
    if (result.includes('apostas') || result.includes('bet') || result.includes('cassino')) return Niche.BETTING;
    if (result.includes('e-commerce') || result.includes('loja') || result.includes('drop')) return Niche.DROPSHIPPING;
    if (result.includes('relacionamento') || result.includes('espiritual')) return Niche.SPIRITUALITY;
    if (result.includes('negócio') || result.includes('saas') || result.includes('empresa')) return Niche.BUSINESS;
    if (result.includes('educação') || result.includes('curso') || result.includes('aprender')) return Niche.EDUCATION;
    
    return Niche.BUSINESS;
  } catch (error) {
    console.error("Niche Detection Error:", error);
    return Niche.BUSINESS;
  }
}

export async function analyzeAdMetadata(description: string, infoAds: string): Promise<{ niche: string; escala: number }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analise este anúncio e retorne um JSON com: "nicho" (ex: Saúde, Info, Dropshipping, Apostas, Relacionamento) e "escala" (um valor de 1 a 10 baseado na agressividade da cópia e volume de anúncios mencionados na coluna Info Ads).
      
      DESCRIÇÃO: ${description}
      INFO ADS: ${infoAds}`,
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nicho: { type: Type.STRING, description: "O nicho detectado do anúncio." },
            escala: { type: Type.NUMBER, description: "Nível de escala de 1 a 10." }
          },
          required: ["nicho", "escala"]
        }
      }
    });

    const data = JSON.parse(response.text || '{"nicho": "Negócios", "escala": 1}');
    return {
      niche: data.nicho || data.niche || "Negócios",
      escala: data.escala || 1
    };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return { niche: "Negócios", escala: 1 };
  }
}

export async function auditAdStrategy(ad: any) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Você é um copywriter de elite e estrategista de tráfego pago. Faça uma AUDITORIA FORENSE deste anúncio que está escalando:
      
      MARCA: ${ad.title}
      NICHO: ${ad.niche}
      TICKET: ${ad.ticketPrice}
      FUNIL: ${ad.funnelType}
      COPY: ${ad.copy}
      
      Retorne um JSON seguindo esta estrutura definida no schema.`,
      config: {
        temperature: 0.9,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hook_analysis: {
              type: Type.STRING,
              description: "análise do gancho inicial"
            },
            core_mechanism: {
              type: Type.STRING,
              description: "qual o mecanismo único da oferta"
            },
            psychological_triggers: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "lista de gatilhos psicológicos usados"
            },
            scale_prediction: {
              type: Type.STRING,
              description: "previsão de durabilidade dessa escala"
            },
            improvement_tip: {
              type: Type.STRING,
              description: "uma dica prática para modelar e melhorar"
            }
          },
          required: ["hook_analysis", "core_mechanism", "psychological_triggers", "scale_prediction", "improvement_tip"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Audit Error:", error);
    throw error;
  }
}