# Arquitetura Backend AdScale v2.0 (PostgreSQL + Redis)

## 1. Diagrama Lógico

```mermaid
graph TD
    User[Cliente Browser] -->|HTTPS/JSON| API[FastAPI Load Balanced]
    
    subgraph "Camada de Dados"
        API -->|Leitura/Escrita (AsyncPG)| DB[(PostgreSQL 15)]
        API -->|Cache/RateLimit (Redis-py)| Cache[(Redis 7)]
    end
    
    subgraph "Processamento (Futuro)"
        API -->|Enfileira Tarefas| Queue[(Redis Pub/Sub)]
        Worker[Celery Worker] -->|Consome| Queue
        Worker -->|Salva Resultados| DB
    end
```

## 2. Componentes da Infraestrutura

### Banco de Dados: PostgreSQL 15
- **Por que:** Suporte nativo a JSONB (perfeito para campos flexíveis de ads), Transacional (ACID), Escalabilidade vertical robusta.
- **Driver:** `asyncpg` (O driver Python mais rápido atualmente).
- **Pooling:** `SQLAlchemy AsyncEngine` configurado com pool size de 20 conexões.

### Cache & Pub/Sub: Redis 7-alpine
- **Uso Crítico:**
  1. **Cache de Consultas:** Cachear resultados de buscas pesadas (ex: "Top 20 Ads Brasil").
  2. **Rate Limiting:** Controlar requisições por IP (ex: 200 req/min).
  3. **Filas:** Broker para Celery (scrapers em background).

## 3. Estratégia de Migração de Dados
Devido à mudança de SQLite para Postgres, a migração envolverá:
1. **Extração:** Dump dos dados do SQLite para JSON limpo.
2. **Transformação:** Conversão de strings de data para objetos Datetime com Timezone UTC.
3. **Carga:** Script Python para inserir os dados no Postgres usando a nova modelagem.

## 4. Modelagem de Dados (Schema)

### Tabela `users`
| Coluna | Tipo | Detalhes |
|--------|------|----------|
| `id` | UUID | PK, Default `uuid_generate_v4()` |
| `email` | VARCHAR(255) | Unique, Indexado |
| `tenant_id` | UUID | FK -> `organizations.id` (Preparo Multi-tenant) |
| ... | ... | ... |

### Tabela `ads`
| Coluna | Tipo | Detalhes |
|--------|------|----------|
| `id` | UUID | PK |
| `owner_id` | UUID | FK -> `tenants.id` (Multi-tenant isolation) |
| `targeting` | JSONB | Indexado com GIN Index para busca rápida dentro do JSON |
| `performance`| JSONB | Indexado |
| `created_at` | TIMESTAMPTZ | Timezone Aware (UTC) |

---

## 5. Checklist de Implementação
- [ ] Configurar `docker-compose.yml` com Postgres e Redis.
- [ ] Atualizar `database.py` para usar `DATABASE_URL` do ambiente.
- [ ] Refatorar `models.py` para usar tipos PG (`UUID`, `JSONB`, `DateTime(timezone=True)`).
- [ ] Criar script de inicialização (`init_db.py`).
