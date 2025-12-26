from .worker import celery_app
from .scanner import AdScanner
from .database import SyncSessionLocal
from .models import AdModel
from sqlalchemy import select

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
            if ad_dict['id'] in existing_map:
                # Update existing
                existing_rec = existing_map[ad_dict['id']]
                for k, v in ad_dict.items():
                    if hasattr(existing_rec, k):
                        setattr(existing_rec, k, v)
                updated_count += 1
            else:
                # Create new
                # Ensure we filter out keys that might not exist in model if schema allows extras
                # But AdModel should match.
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
