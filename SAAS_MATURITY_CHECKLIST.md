# Checklist de Maturidade Técnica: AdScale SaaS (BigSpy/AdSpy Level)

Este documento detalha o roteiro técnico para elevar o AdScale de um protótipo funcional para uma plataforma SaaS comercial robusta, segura e escalável.

---

## 1. Pagamentos & Monetização (Financeiro)
**Estado Atual:** Simulado no Frontend (Mock).
**Prioridade:** 🚨 **CRÍTICA** (Bloqueia Receita)

- [ ] **Integração de Gateway Real**
    - **Ação:** Implementar Stripe ou Pagar.me/Asaas no Backend.
    - **Dependências:** `stripe-python` ou SDK do gateway.
    - **Riscos:** Perda de dinheiro, chargebacks, falha na renovação automática.
- [x] **Webhook Handler Seguro**
    - **Ação:** Criar endpoint `/webhooks/stripe` para receber `invoice.paid`, `customer.subscription.deleted`.
    - **Status:** Implementado em `BillingService._handle_invoice_paid`.
    - **Detalhe:** Validar assinaturas digitais do webhook para evitar spoofing.
- [ ] **Gestão de Assinaturas (Lifecycle)**
    - **Ação:** Lógica para bloquear acesso imediatamente após falha de pagamento (Grace Period).
    - **Ação:** Upgrade/Downgrade de plano com cálculo de pro-rata.

## 2. Autenticação & Gestão de Identidade
**Estado Atual:** JWT com Refresh Token e Rotação Básica.
**Prioridade:** ✅ **RESOLVIDO (Básico)**

- [ ] **Email de Confirmação & Recuperação de Senha**
    - **Ação:** Integrar SMTP (SendGrid/AWS SES) para envio de emails transacionais.
    - **Risco:** Usuários perdendo contas geram tickets de suporte manuais infinitos.
- [x] **Refresh Tokens & Rotação**
    - **Ação:** Implementar par Access Token (curta duração) + Refresh Token (longa duração).
    - **Status:** Implementado endpoints `/auth/refresh`, login e register retornam ambos os tokens.
- [ ] **OAuth2 / Social Login** (Futuro)
    - **Ação:** Login com Google/Facebook.

## 3. Autorização (RBAC - Role Based Access Control)
**Estado Atual:** Hardcoded `if user.role == 'admin'` em cada rota.
**Prioridade:** ⚠️ **IMPORTANTE**

- [ ] **Middleware de Permissões**
    - **Ação:** Criar sistema de Scopes (ex: `ads:read`, `ads:write`, `export:csv`).
    - **Motivo:** Permitir planos diferentes (Plano Básico não exporta CSV, Plano Pro exporta).
- [ ] **Multi-Tenancy (Isolamento de Dados)**
    - **Ação:** Garantir que um usuário NUNCA veja os "Favoritos" ou "Pastas" de outro usuário.

## 4. Banco de Dados & Escalabilidade
**Estado Atual:** Código pronto para PostgreSQL (Docker Compose Definido), rodando SQLite localmente por limitação de ambiente.
**Prioridade:** ⚠️ **ALTA**

- [x] **Configuração PostgreSQL (Docker)**
    - **Status:** `docker-compose.yml` configurado com Postgres e Redis.
    - **Ação Restante:** Validar execução em ambiente com Docker funcional.
- [ ] **Camada de Cache (Redis)**
    - **Ação:** Cachear queries pesadas (ex: Contagem de Ads por Nicho, Top 20 Rankings).
    - **Motivo:** A Home carrega instantaneamente, sem bater no banco a cada F5.
- [ ] **Pool de Conexões (PgBouncer)**
    - **Ação:** Configurar SQLAlchemy para usar pooling eficiente (Já configurado `pool_size` no `database.py`).

## 5. Coleta de Dados (Data Ingestion Pipeline)
**Estado Atual:** Importação CSV via Background Task (Celery).
**Prioridade:** 🚨 **CRÍTICA** (Core do Business)

- [x] **Scraping/Importação Assíncrona (Celery)**
    - **Ação:** Implementado Celery + Redis.
    - **Status:** Importação de Ads moveu para background task (`import_ads_task`).
- [ ] **Proxy Rotation & Anti-Detect**
    - **Ação:** Integrar serviços de Proxy Residencial (BrightData, Smartproxy) para não ser bloqueado pelo Meta/TikTok.
    - **Ação:** Usar navegadores headless não detectáveis (Puppeteer Stealth / Playwright).

## 6. Auditoria & Logs (Observabilidade)
**Estado Atual:** Logs básicos (arquivo `backend_debug.log`).
**Prioridade:** ⚠️ **IMPORTANTE**

- [ ] **Logs Estruturados (JSON)**
    - **Ação:** Usar biblioteca `structlog` ou `logging` configurado para JSON.
    - **Motivo:** Facilitar busca em ferramentas como Datadog/ELK.
- [ ] **Audit Trail (Rastro de Auditoria)**
    - **Ação:** Tabela `audit_logs` registrando: "Quem", "O Quê", "Quando", "IP".

## 7. Segurança (AppSecurity)
**Estado Atual:** CORS Validado, Senhas com Bcrypt.
**Prioridade:** 🔥 **ALTA**

- [ ] **Rate Limiting (Limitação de Taxa)**
    - **Ação:** Bloquear IPs que fazem 1000 requests/minuto.
    - **Dependência:** `fastapi-limiter` + Redis (Requer Redis ativo).
- [ ] **Sanitização de Input (XSS/SQLi)**
    - **Ação:** Revisar todas as entradas de texto (Busca, Comentários) contra injeção de scripts.

## 8. Monitoramento & Alertas
**Estado Atual:** Check visual "se o site abre".
**Prioridade:** 🗓️ **FUTURO**

- [ ] **Uptime Monitor**
    - **Ação:** Pingdom ou UptimeRobot monitorando `/health`.
- [ ] **Error Tracking (Sentry)**
    - **Ação:** Integrar Sentry no Backend e Frontend.

## 9. Performance & Otimização
**Estado Atual:** Imagens carregadas diretamente da URL original (Link Rot) ou base64 (Pesado).
**Prioridade:** ⚠️ **IMPORTANTE**

- [ ] **CDN de Imagens/Vídeos**
    - **Ação:** Fazer upload dos criativos para AWS S3 / Cloudflare R2 e servir via CDN.
    - **Motivo:** Se o anúncio original for apagado no Facebook, você ainda tem a cópia.

---

### Resumo do Plano de Ação Imediato (Próximos Passos)

1.  **Validar Docker/Redis:** Garantir que o ambiente local consiga subir os containers para suportar as filas.
2.  **Webhook de Pagamentos:** Implementar o endpoint de verdade para receber confirmações de pagamento.
3.  **Deploy Staging:** Colocar essa versão em um servidor (VPS/Render/Railway) para validar o ambiente real (Postgres + Redis).
