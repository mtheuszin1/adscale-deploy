
import sqlite3

def clean_ads(full_wipe=False):
    try:
        conn = sqlite3.connect('adscale.db')
        cursor = conn.cursor()
        
        if full_wipe:
            print("Performing FULL WIPE of the ads table...")
            cursor.execute("DELETE FROM ads")
            cursor.execute("DELETE FROM ad_history")
        else:
            # Delete ads that don't have local media (vulnerable to expiration)
            cursor.execute("DELETE FROM ads WHERE mediaUrl NOT LIKE '/media/%'")
        
        deleted_count = cursor.rowcount
        conn.commit()
        print(f"Cleanup finished. Deleted {deleted_count} records.")
        conn.close()
    except Exception as e:
        print(f"Error cleaning ads: {e}")

if __name__ == "__main__":
    import sys
    wipe = "--wipe" in sys.argv
    clean_ads(full_wipe=wipe)
