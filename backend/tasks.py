from .worker import celery_app
from .scanner import AdScanner
from .database import SyncSessionLocal
from .models import AdModel
from sqlalchemy import select
import os
import requests
import hashlib
from typing import Optional

MEDIA_DIR = "backend/media"
if not os.path.exists(MEDIA_DIR):
    os.makedirs(MEDIA_DIR, exist_ok=True)

def download_file(url: str, ad_id: str) -> Optional[str]:
    """Downloads a file and returns the local path relative to backend root."""
    try:
        if not url or not url.startswith("http"):
            return None
            
        # Avoid re-downloading local files
        if url.startswith("/media/"):
            return url

        # Generate a stable filename
        clean_url = url.split("?")[0].split("#")[0]
        ext = clean_url.split(".")[-1].lower() if "." in clean_url else "mp4"
        if len(ext) > 4 or not ext.isalnum():
            ext = "mp4" # fallback
            
        filename = f"{ad_id}_{hashlib.md5(url.encode()).hexdigest()[:8]}.{ext}"
        filepath = os.path.join(MEDIA_DIR, filename)
        
        if os.path.exists(filepath):
            return f"/media/{filename}"
            
        print(f"[Worker] Downloading media: {url}")
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, stream=True, timeout=60, headers=headers)
        if response.status_code == 200:
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            print(f"[Worker] Save complete: {filepath}")
            return f"/media/{filename}"
        else:
            print(f"[Worker] Download failed with status: {response.status_code}")
        return None
    except Exception as e:
        print(f"[Worker] Error downloading {url}: {e}")
        return None

# Celery Tasks

@celery_app.task(name="scan_ad_task")
def scan_ad_task(url: str):
    """
    Background task to scan a URL using the AdScanner synchronous logic.
    """
    print(f"[Worker] Starting scan for {url}")
    scanner = AdScanner()
    result = scanner.scan_page(url)
    print(f"[Worker] Scan finished: {result['success']}")
    return result

@celery_app.task(name="import_ads_task")
def import_ads_task(ads_data: list):
    """
    Background task to import ads in bulk.
    """
    print(f"[Worker] Starting bulk import of {len(ads_data)} ads")
    db = SyncSessionLocal()
    try:
        incoming_ids = [ad['id'] for ad in ads_data]
        
        # 1. Fetch existing ads in bulk
        # Note: sync version uses select same way but execution is different
        stmt = select(AdModel).where(AdModel.id.in_(incoming_ids))
        result = db.execute(stmt)
        existing_map = {rec.id: rec for rec in result.scalars().all()}
        
        new_objects = []
        updated_count = 0
        
        for ad_dict in ads_data:
            # Persistence Logic: Download media if it's an external URL
            original_media = ad_dict.get('mediaUrl')
            if original_media:
                local_path = download_file(original_media, ad_dict['id'])
                if local_path:
                    ad_dict['mediaUrl'] = local_path
                    # Also update thumbnail if it's the same
                    if ad_dict.get('thumbnail') == original_media:
                        ad_dict['thumbnail'] = local_path

            if ad_dict['id'] in existing_map:
                # Update existing
                existing_rec = existing_map[ad_dict['id']]
                for k, v in ad_dict.items():
                    if hasattr(existing_rec, k):
                        setattr(existing_rec, k, v)
                updated_count += 1
            else:
                # Create new
                new_ad = AdModel(**ad_dict)
                new_objects.append(new_ad)
        
        if new_objects:
            db.add_all(new_objects)
            
        db.commit()
        print(f"[Worker] Import complete. Created: {len(new_objects)}, Updated: {updated_count}")
        return {"created": len(new_objects), "updated": updated_count}
    except Exception as e:
        print(f"[Worker] API Import Failed: {e}")
        db.rollback()
        raise e
    finally:
        db.close()
