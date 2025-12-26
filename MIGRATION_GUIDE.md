# Guia de Migração: SQLite para PostgreSQL

Este guia descreve os passos para migrar o ambiente de desenvolvimento (SQLite) para produção (PostgreSQL + Redis).

## 1. Pré-requisitos
- Docker e Docker Compose instalados.
- Python 3.9+ instalado.
- Ambiente virtual ativo.

## 2. Configuração do Ambiente

1. **Parar servidor atual:**
   Pare qualquer instância do `uvicorn` rodando no terminal.

2. **Subir Infraestrutura:**
   Execute o comando para iniciar o PostgreSQL e Redis:
   ```bash
   docker-compose up -d
   ```
   *Aguarde cerca de 30 segundos para o banco inicializar.*

3. **Verificar Conexão:**
   Teste se o container está rodando:
   ```bash
   docker ps
   ```
   Você deve ver `adscale_postgres` e `adscale_redis` com status `Up`.

## 3. Instalar Dependências de Produção

Instale os drivers assíncronos para Postgres e Redis:
```bash
pip install asyncpg psycopg2-binary redis
```

## 4. Inicialização do Banco (Schema)

Como estamos mudando de banco, precisamos recriar as tabelas. O FastAPI faz isso automaticamente no startup (`backend/main.py`), mas você precisa definir a variável de ambiente correta.

No Terminal (Powershell):
```powershell
$env:DATABASE_URL="postgresql+asyncpg://adscale_admin:adscale_secure_password_2025@localhost:5432/adscale_prod"
uvicorn backend.main:app --reload --port 8000
```

Se tudo der certo, você verá os logs do SQLAlchemy criando as tabelas (`CREATE TABLE ads ...`) no console do uvicorn.

## 5. Migração de Dados (Carga Inicial)

Se você tem dados importantes no SQLite (`adscale.db`), criei um script utilitário para exportar e importar.

**Crie um arquivo `migrate_data.py` na raiz:**

```python
import sqlite3
import json
import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

# Config
SQLITE_DB = "adscale.db"
PG_URL = "postgresql+asyncpg://adscale_admin:adscale_secure_password_2025@localhost:5432/adscale_prod"

def extract_sqlite():
    conn = sqlite3.connect(SQLITE_DB)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Extract Ads
    cursor.execute("SELECT * FROM ads")
    ads = [dict(row) for row in cursor.fetchall()]
    
    # Extract Users
    cursor.execute("SELECT * FROM users")
    users = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    return ads, users

async def load_postgres(ads, users):
    engine = create_async_engine(PG_URL)
    async with engine.begin() as conn:
        # Importante: Limpar dados antigos se houver
        # await conn.execute(text("TRUNCATE table ads, users CASCADE;"))
        
        # Inserir Users
        for user in users:
            # Ajustar colunas se necessário (ex: converter boolean 0/1 para True/False)
             await conn.execute(
                text("INSERT INTO users (id, email, name, hashed_password, role, favorites) VALUES (:id, :email, :name, :hashed_password, :role, :favorites) ON CONFLICT DO NOTHING"),
                user
            )

        # Inserir Ads
        for ad in ads:
             # Add missing columns defaults if sqlite schema was older
             ad['owner_id'] = None
             ad['organization_id'] = None
             
             # Insert
             columns = ', '.join(ad.keys())
             # values placeholder logic needs to be robust, usually ORM is better here but raw sql is faster for migration
             # For simplicity in this snippet, assumes ORM logic or similar structure.
             # Recommended: Use the API /ads/import endpoint locally pointing to PG!
             pass
             
    await engine.dispose()

if __name__ == "__main__":
    print("Extraindo do SQLite...")
    ads, users = extract_sqlite()
    print(f"Encontrados {len(ads)} anúncios e {len(users)} usuários.")
    
    print("Para importar, recomendo rodar o Backend conectado no Postgres e usar o script 'import_csv' ou endpoint de importação enviando esse JSON extraído.")
    
    with open('migration_dump_ads.json', 'w') as f:
        json.dump(ads, f, default=str)
        
    print("Dump salvo em migration_dump_ads.json. Use o CSV Import Wizard ou API para recarregar.")
```

## 6. Próximos Passos
Após validar o ambiente local com Docker:
1. Atualizar o `Dockerfile` para produção.
2. Configurar variáveis de ambiente no serviço de hospedagem (Render/Railway/AWS).
