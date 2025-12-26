# 🚀 AdScale V1.0 Launch Readiness Checklist

Status Atual: **Backend Avançado (Pre-Production)** | **Frontend (Parcialmente Integrado)**

---

## ✅ 1. Concluído (Backend Core)
A fundação técnica foi modernizada para suportar escala SaaS.

- [x] **Database Engine**: Código preparado para **PostgreSQL** (models.py refatorado com UUIDs e Timezones).
- [x] **Billing System**: Integração completa **Stripe** (Checkout, Portal, Webhooks Seguros).
- [x] **Security Shield**: Middleware `verify_subscription_access` bloqueando caloteiros na API.
- [x] **Async Architecture**: Configuração **Celery + Redis** para processamento em background.
- [x] **Smart Data**: Algoritmo de Detecção de Região e Classificação de Escala (IA) melhorado.

---

## 🚧 2. Ações Imediatas (Infra & Integração)
O que falta para "ligar os fios" entre o novo Backend potente e o Frontend.

### Infraestrutura Local
- [ ] **Subir Docker**: Executar `docker-compose up -d` para ativar Redis e Postgres.
- [ ] **Configurar .env**: Criar arquivo com chaves reais do Stripe (Test Mode).

### Integração Frontend <-> Backend
- [ ] **Scanner Assíncrono**:
    - O endpoint `/scan-ad` agora retorna um `task_id`.
    - **Falta:** Criar endpoint `GET /tasks/{id}` para o frontend saber quando o scan terminou.
    - **Falta:** Atualizar UI do Scanner para fazer "polling" (perguntar a cada 2s se acabou).
- [ ] **Botão de Assinatura**:
    - **Falta:** Conectar os botões de "Upgrade" no Frontend ao endpoint `/stripe/checkout-session`.
- [ ] **Área do Cliente**:
    - **Falta:** Adicionar botão "Gerenciar Assinatura" no perfil chamando `/stripe/portal`.

---

## 🛠️ 3. Pendências Críticas (Antes do Deploy)

### Autenticação & Recuperação
- [ ] **Forgot Password**: Implementar fluxo de "Esqueci minha senha" (Email com link de reset).
- [ ] **Email Confirmation**: Bloquear contas não verificadas (Opcional para MVP, crítico para Scale).

### Performance
- [ ] **CDN de Imagens**: O sistema ainda carrega imagens direto da URL original. Se o dono apagar, o AdScale perde a imagem.
    - *Solução:* Upload automático para S3/R2 durante o scan.

### Refinamento de Dados
- [ ] **Seed de Planos**: Script SQL para inserir os planos (Pro, Enterprise) no banco com os IDs do Stripe.

---

## 📅 4. Plano de Go-Live (Produção)

1. **Hospedagem**:
   - Backend + Workers: **Railway** ou **Render** (suportam Docker/Python fácil).
   - Frontend: **Vercel** (Custo zero/baixo).
   - Banco + Redis: **Railway** (Managed).

2. **DNS & Domínio**:
   - Comprar domínio (ex: `adscale.ai`).
   - Configurar HTTPS (SSL).

3. **Stripe Prod**:
   - Virar chave de API para "Live Mode".
   - Configurar Webhook URL de produção.
