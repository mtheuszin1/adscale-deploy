
import requests
from bs4 import BeautifulSoup
import re
from typing import Dict, Any

class AdScanner:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

    def scan_page(self, url: str) -> Dict[str, Any]:
        try:
            # Add scheme if missing
            if not url.startswith('http'):
                url = 'https://' + url
                
            response = requests.get(url, headers=self.headers, timeout=10)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Analyze page performance (simulated based on response time)
            load_time = response.elapsed.total_seconds()
            performance_score = max(0, min(100, int((1 - load_time/3) * 100)))

            # Extract Metadata
            title = soup.title.string if soup.title else ""
            desc = soup.find('meta', attrs={'name': 'description'})
            description = desc['content'] if desc else ""
            
            # Analyze Content
            text_content = soup.get_text().lower()
            
            # Detect Niche
            niche_keywords = {
                'black': ['suplemento', 'libido', 'renda extra', 'investimento', 'apostas', 'cassino'],
                'saúde': ['emagrecer', 'dieta', 'pele', 'cabelo', 'dor', 'natural'],
                'tech': ['software', 'app', 'ai', 'curso', 'digital', 'ebook'],
                'e-com': ['frete grátis', 'oferta', 'desconto', 'loja', 'comprar']
            }
            
            detected_niche = 'Outros'
            for niche, keywords in niche_keywords.items():
                if any(k in text_content for k in keywords):
                    detected_niche = niche.upper()
                    break
            
            # Detect Tech Stack
            tech_stack = {
                'shopify': 'shopify' in response.text.lower(),
                'wordpress': 'wp-content' in response.text.lower(),
                'vtex': 'vtex' in response.text.lower(),
                'ticto': 'ticto' in response.text.lower(),
                'kiwify': 'kiwify' in response.text.lower()
            }
            detected_tech = [k for k, v in tech_stack.items() if v]

            return {
                "success": True,
                "data": {
                    "title": title[:50] + "..." if len(title) > 50 else title,
                    "copy": description[:100] + "..." if len(description) > 100 else description,
                    "niche": detected_niche,
                    "rating": performance_score / 10.0,

                    "techStack": {"platform": detected_tech[0] if detected_tech else "Custom"},
                    "siteTraffic": {
                        "visitors": None, # Requires External API (e.g. SimilarWeb)
                        "bounceRate": None,
                        "loadTimeSec": round(load_time, 2) # REAL DATA
                    }
                }
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
