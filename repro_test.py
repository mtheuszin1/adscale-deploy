
import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"
EMAIL = f"test_upload_{int(time.time())}@example.com"
PASSWORD = "password123"

def run_test():
    print(f"--- TESTE DE REPRODUÇÃO: {EMAIL} ---")
    
    # 1. REGISTER
    print("[1] Registrando usuário...")
    res = requests.post(f"{BASE_URL}/register", json={"email": EMAIL, "password": PASSWORD, "name": "Tester"})
    if res.status_code not in [200, 201]:
        print(f"FALHA REGISTRO: {res.status_code} - {res.text}")
        return
    
    auth_data = res.json()
    token = auth_data["access_token"]
    print(f"SUCESSO REGISTRO. Token obtido: {token[:10]}...")

    # 2. LOGIN (Verificar persistência imediata)
    print("\n[2] Verificando Login...")
    res = requests.post(f"{BASE_URL}/login", json={"email": EMAIL, "password": PASSWORD})
    if res.status_code != 200:
        print(f"FALHA LOGIN: {res.status_code} - {res.text}")
        return
    print("SUCESSO LOGIN.")

    # 3. UPLOAD (Import Ads)
    print("\n[3] Testando Upload de Anúncios...")
    payload = [
        {
            "id": "test-ad-1",
            "title": "Anúncio de Teste Backend",
            "platform": "Meta Ads",
            "niche": "Technology",
            "adCount": 10,
            "rating": 4.5,
            "performance": {"ctr": "2.1%"},
            "siteTraffic": {},
            "techStack": {},
            "targeting": {},
            "addedAt": "2023-01-01T00:00:00" # Should be ignored by schema but let's see
        }
    ]
    
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.post(f"{BASE_URL}/ads/import", json=payload, headers=headers)
    
    if res.status_code == 200:
        print(f"SUCESSO UPLOAD: {res.json()}")
    else:
        print(f"FALHA UPLOAD: {res.status_code} - {res.text}")

if __name__ == "__main__":
    try:
        run_test()
    except Exception as e:
        print(f"ERRO DE CONEXÃO: {e}")
        print("Verifique se o backend está rodando em " + BASE_URL)
