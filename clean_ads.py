import os
import sys

# Add current dir to path to import backend modules
sys.path.append(os.getcwd())

from backend.database import SyncSessionLocal
from backend.models import AdModel, AdHistoryModel

def clean_ads(full_wipe=False):
    db = SyncSessionLocal()
    try:
        if full_wipe:
            print("Performing FULL WIPE of the ads table via SQLAlchemy...")
            db.query(AdHistoryModel).delete()
            db.query(AdModel).delete()
        else:
            # Delete ads that don't have local media (vulnerable to expiration)
            print("Cleaning up ads with external (non-persisted) links...")
            # We delete anything that starts with http (external) 
            # and keep items that start with /media/ (local)
            db.query(AdModel).filter(AdModel.mediaUrl.like('http%')).delete(synchronize_session=False)
        
        db.commit()
        print(f"Cleanup finished successfully.")
    except Exception as e:
        print(f"Error cleaning ads: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    import sys
    wipe = "--wipe" in sys.argv
    clean_ads(full_wipe=wipe)
