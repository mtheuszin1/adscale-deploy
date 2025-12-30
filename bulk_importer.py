
import os
import sys
import pandas as pd
import hashlib
from datetime import datetime
from typing import Optional

# Add current dir to path to import backend modules
sys.path.append(os.getcwd())

from backend.database import SyncSessionLocal
from backend.models import AdModel, AdHistoryModel
from backend.tasks import download_file

def map_niche(description):
    desc = (description or '').lower()
    if any(x in desc for x in ['saúde', 'dieta', 'emagrecer', 'fit', 'corpo', 'workout', 'gym']):
        return "Saúde & Bem-estar"
    if any(x in desc for x in ['dinheiro', 'lucro', 'investimento', 'milhas', 'finanças', 'crypto']):
        return "Finanças & Investimentos"
    if any(x in desc for x in ['aposta', 'bet', 'tiger', 'cassino', 'jogo', 'slot']):
        return "iGaming & Apostas"
    if any(x in desc for x in ['loja', 'frete', 'comprar', 'entrega', 'oferta', 'desconto']):
        return "E-commerce & Dropshipping"
    if any(x in desc for x in ['curso', 'mentor', 'aula', 'vender', 'marketing']):
        return "Infoprodutos & Educação"
    return "Negócios"

def detect_region_py(info_ads):
    info = (info_ads or '').lower()
    if 'brazil' in info or 'brasil' in info or ' br' in info:
        return "Brasil"
    if 'usa' in info or 'united states' in info or ' us' in info:
        return "Estados Unidos"
    if 'colombia' in info:
        return "Colômbia"
    if 'paraguay' in info or 'py' in info:
        return "Paraguai"
    return "Brasil"

from concurrent.futures import ThreadPoolExecutor

def process_ad_row(row_data):
    index, row = row_data
    db = SyncSessionLocal()
    try:
        # Basic Mapping
        ad_id = str(row.get('ID', row.get('id', index)))
        brand_name = row.get('Página', row.get('página', 'Sinal Desconhecido'))
        info_ads = str(row.get('Info Ads', '1'))
        media_url = row.get('URL Criativo', row.get('url criativo', ''))
        library_url = row.get('URL Biblioteca', '#')
        description = str(row.get('Descrição', ''))
        sales_page = row.get('URL Destino', '#')

        # Extract AdCount
        ad_count = 1
        match = [int(s) for s in info_ads.split() if s.isdigit()]
        if match: ad_count = match[0]

        # Determine Region
        region_name = detect_region_py(info_ads)
        region_code = "BR" if region_name == "Brasil" else "US" if region_name == "Estados Unidos" else "CO"

        # Persistence (Download Media) - Parallelized via Executor
        local_media = download_file(media_url, ad_id) if media_url else None
        final_media = local_media if local_media else media_url

        # Create Model
        ad_data = {
            "id": ad_id,
            "title": brand_name,
            "brandId": brand_name.lower().replace(" ", "_"),
            "brandLogo": f"https://ui-avatars.com/api/?name={brand_name.replace(' ', '+')}&background=020617&color=fff&bold=true",
            "platform": "Facebook",
            "niche": map_niche(description),
            "type": "VSL" if (".mp4" in media_url.lower() or "video" in media_url.lower()) else "Direto",
            "status": "Escala" if ad_count > 30 else "Validado",
            "thumbnail": final_media,
            "mediaUrl": final_media,
            "mediaHash": f"AS-{ad_id[-4:].upper()}" if len(ad_id) > 4 else "AS-NEW",
            "copy": description,
            "cta": "Saiba Mais",
            "insights": f"Sinal detectado com {ad_count} ativos na região {region_name}.",
            "rating": min(5.0, 3.0 + (ad_count/50.0)),
            "adCount": ad_count,
            "ticketPrice": "Consultar",
            "funnelType": "Direto",
            "salesPageUrl": sales_page,
            "libraryUrl": library_url,
            "targeting": {
                "locations": [{"country": region_name, "code": region_code, "volume": ad_count * 100}]
            }
        }

        # Check if exists
        existing = db.query(AdModel).filter(AdModel.id == ad_id).first()
        if existing:
            for key, value in ad_data.items():
                setattr(existing, key, value)
        else:
            new_ad = AdModel(**ad_data)
            db.add(new_ad)
        
        # History
        history = AdHistoryModel(ad_id=ad_id, adCount=ad_count)
        db.add(history)
        db.commit()
        return True
    except Exception as e:
        print(f"Error on row {index}: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def run_bulk_import(csv_path):
    if not os.path.exists(csv_path):
        print(f"Error: File {csv_path} not found.")
        return

    print(f"--- Starting TURBO Bulk Import from {csv_path} ---")
    df = pd.read_csv(csv_path)
    total_rows = len(df)
    print(f"Detected {total_rows} ads. Using 10 parallel workers.")

    rows = list(df.iterrows())
    count = 0
    errors = 0

    with ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(process_ad_row, rows))
        
    count = sum(1 for r in results if r)
    errors = total_rows - count
    print(f"COMPLETED. Imported/Updated {count} ads. {errors} errors.")

if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "scalatracker_criativos_2025-12-30.csv"
    run_bulk_import(path)
