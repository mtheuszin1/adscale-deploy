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

# Reuse session for connection pooling
_session = requests.Session()
_session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.facebook.com/',
    'Connection': 'keep-alive'
})

def download_file(url: str, ad_id: str) -> Optional[str]:
    """Downloads a file and returns the local path relative to backend root."""
    try:
        if not url or not url.startswith("http"):
            return None
            
        if url.startswith("/media/"):
            return url

        # Generate a stable filename
        clean_url = url.split("?")[0].split("#")[0]
        ext = clean_url.split(".")[-1].lower() if "." in clean_url else "mp4"
        if len(ext) > 4 or not ext.isalnum():
            ext = "mp4" 
            
        filename = f"{ad_id}_{hashlib.md5(url.encode()).hexdigest()[:8]}.{ext}"
        filepath = os.path.join(MEDIA_DIR, filename)
        
        if os.path.exists(filepath):
            return f"/media/{filename}"
            
        response = _session.get(url, stream=True, timeout=30)
        if response.status_code == 200:
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=16384):
                    f.write(chunk)
            return f"/media/{filename}"
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
    from concurrent.futures import ThreadPoolExecutor

    def process_ad(ad_dict):
        # Persistence Logic: Download media if it's an external URL
        original_media = ad_dict.get('mediaUrl')
        if original_media:
            local_path = download_file(original_media, ad_dict['id'])
            if local_path:
                ad_dict['mediaUrl'] = local_path
                # Also update thumbnail if it's the same
                if ad_dict.get('thumbnail') == original_media:
                    ad_dict['thumbnail'] = local_path

        # Sub-DB session for this thread
        thread_db = SyncSessionLocal()
        try:
            from .models import AdHistoryModel
            existing = thread_db.query(AdModel).filter(AdModel.id == ad_dict['id']).first()
            if existing:
                for k, v in ad_dict.items():
                    if hasattr(existing, k):
                        setattr(existing, k, v)
                # History
                history = AdHistoryModel(ad_id=ad_dict['id'], adCount=ad_dict.get('adCount', 1))
                thread_db.add(history)
                thread_db.commit()
                return "updated"
            else:
                new_ad = AdModel(**ad_dict)
                thread_db.add(new_ad)
                # History
                history = AdHistoryModel(ad_id=ad_dict['id'], adCount=ad_dict.get('adCount', 1))
                thread_db.add(history)
                thread_db.commit()
                return "created"
        except Exception as e:
            print(f"[Worker] Row Error: {e}")
            thread_db.rollback()
            return "error"
        finally:
            thread_db.close()

    try:
        with ThreadPoolExecutor(max_workers=20) as executor:
            results = list(executor.map(process_ad, ads_data))
        
        created = results.count("created")
        updated = results.count("updated")
        errors = results.count("error")
        
        print(f"[Worker] Import complete. Created: {created}, Updated: {updated}, Errors: {errors}")
        return {"created": created, "updated": updated, "errors": errors}
    except Exception as e:
        print(f"[Worker] API Import Failed: {e}")
        db.rollback()
        raise e
    finally:
        db.close()
