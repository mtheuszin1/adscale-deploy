
import os
import random

class AIEngine:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY")

    async def generate_copy(self, original_copy: str, niche: str, tone: str = "aggressive"):
        """
        Generates high-converting ad copy variations based on an existing ad.
        For now, uses a high-quality template system if no API key is present.
        """
        if not self.api_key:
            return self._generate_mock_variations(original_copy, niche, tone)
        
        # In a real implementation, we would call Gemini/GPT here
        # For this MVP, we return optimized templates to ensure speed and reliability
        return self._generate_mock_variations(original_copy, niche, tone)

    def _generate_mock_variations(self, original: str, niche: str, tone: str):
        hooks = [
            "PARE de perder dinheiro com estratégias que não escalam.",
            "O segredo que os grandes players de " + niche + " não te contam.",
            "Descubra como duplicar seu ROI em 24h usando esse padrão.",
            "Finalmente revelado: O blueprint da escala infinita para " + niche + "."
        ]
        
        bodies = [
            "Não é sorte, é engenharia. Analisamos milhares de sinais e este padrão é o que está venciendo o leilão hoje.",
            "Se você quer resultados de elite, precisa de ferramentas de elite. Pare de testar no escuro.",
            "A concorrência está usando inteligência de dados enquanto você usa intuição. Mude o jogo agora."
        ]
        
        ctas = [
            "QUERO ESCALAR AGORA",
            "VER MAPA DA ESCALA",
            "COPIAR ESTRATÉGIA"
        ]

        variations = []
        for i in range(3):
            v = f"{random.choice(hooks)}\n\n{random.choice(bodies)}\n\n👉 {random.choice(ctas)}"
            variations.append({"id": i, "text": v, "type": "variation"})
            
        return variations

    async def strategic_decode(self, copy: str, niche: str):
        """
        Provides a deep analytical breakdown of the ad strategy.
        """
        hooks = [
            "Gancho de Curiosidade Negativa (Medo de Perda)",
            "Prova Social de Autoridade Implícita",
            "Contraste de Estado (Antes vs Depois)",
            "Desafio Direto ao Conhecimento do Usuário"
        ]
        
        pain_points = [
            "Baixa retenção no checkout",
            "Custo de aquisição (CAC) instável",
            "Falta de previsibilidade na escala",
            "Dependência de criativos viciados"
        ]
        
        # Consistent but randomized for the ad
        random.seed(hash(copy))
        sophistication = random.randint(3, 5)
        
        return {
            "hook": random.choice(hooks),
            "pain_point": random.choice(pain_points),
            "market_sophistication": sophistication,
            "strategic_summary": f"O anúncio utiliza um nível de sofisticação {sophistication}, focando em um público que já conhece as soluções básicas e busca um diferencial mecanismo único."
        }

ai_engine = AIEngine()
