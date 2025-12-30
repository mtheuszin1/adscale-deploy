
import sys
import os
sys.path.append(os.getcwd())

from backend.tasks import download_file
import asyncio

async def test():
    # Mixkit public video
    url = "https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-preview.mp4"
    result = download_file(url, "test_ad")
    print(f"Download result: {result}")
    
    if result:
        print(f"File exists: {os.path.exists('backend' + result)}")

if __name__ == "__main__":
    asyncio.run(test())
