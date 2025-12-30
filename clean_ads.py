
import sqlite3

def clean_ads():
    try:
        conn = sqlite3.connect('adscale.db')
        cursor = conn.cursor()
        
        # Count before
        cursor.execute("SELECT COUNT(*) FROM ads")
        total_before = cursor.fetchone()[0]
        print(f"Total ads: {total_before}")
        
        # Delete ads that don't have local media (vulnerable to expiration)
        # These are the ones with external URLs from digitalocean spaces etc
        cursor.execute("DELETE FROM ads WHERE mediaUrl NOT LIKE '/media/%'")
        
        deleted_count = cursor.rowcount
        conn.commit()
        
        # Count after
        cursor.execute("SELECT COUNT(*) FROM ads")
        total_after = cursor.fetchone()[0]
        
        print(f"Deleted {deleted_count} ads without local media.")
        print(f"Remaining ads: {total_after}")
        
        conn.close()
    except Exception as e:
        print(f"Error cleaning ads: {e}")

if __name__ == "__main__":
    clean_ads()
