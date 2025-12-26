# Guia de Instalação na Hostinger (VPS) - Passo a Passo para Iniciantes

Este guia vai te ensinar a colocar o **AdScale** no ar em uma VPS da Hostinger (Ubuntu 22.04), partindo do zero.

---

## Passo 1: Preparar o Servidor
Após comprar a VPS na Hostinger, você receberá um **IP** (ex: `192.168.1.50`) e uma senha para o usuário `root`.

1. **Acesse o Terminal da VPS**:
   - No Windows, abra o **PowerShell**.
   - Digite: `ssh root@SEU_IP_DA_VPS`
   - Digite a senha quando pedir (ela não aparece enquanto você digita).

2. **Instalar o Docker** (Copie e cole os comandos abaixo, um por um):
   ```bash
   apt update
   apt install docker.io docker-compose-plugin -y
   ```
   *Isso instala o "motor" que vai rodar seu site, banco de dados e filas.*

---

## Passo 2: Enviar os Arquivos para a VPS

Como você está no Windows, a maneira mais fácil sem usar Git avançado é usar o **GitHub** ou criar um arquivo ZIP. Vamos pelo método mais profissional e simples: **GitHub**.

### No seu Computador (Windows):
1. Crie um repositório novo no GitHub (ex: `adscale-deploy`).
2. Abra o terminal na pasta do projeto e rode:
   ```powershell
   git init
   git add .
   git commit -m "Deploy inicial"
   git branch -M main
   # Substitua pelo SEU link do github
   git remote add origin https://github.com/SEU_USUARIO/adscale-deploy.git
   git push -u origin main
   ```

### Na VPS (Terminal Preto):
3. Baixe o código lá:
   ```bash
   git clone https://github.com/SEU_USUARIO/adscale-deploy.git
   cd adscale-deploy
   ```

---

## Passo 3: Configurar as Senhas (.env)

Você precisa criar o arquivo de configurações secretas na VPS.

1. Na pasta do projeto na VPS, digite:
   ```bash
   nano .env
   ```
   *(Isso abre um editor de texto simples).*

2. Cole o conteúdo abaixo (Botão direito do mouse cola no terminal):
   ```ini
   # --- BANCO DE DADOS ---
   POSTGRES_USER=adscale_admin
   POSTGRES_PASSWORD=umasenha_muito_segura_aqui_123
   POSTGRES_DB=adscale_prod
   
   # --- SEGURANÇA ---
   SECRET_KEY=digite_qualquer_coisa_aleatoria_e_longa_aqui
   ALLOWED_ORIGINS=http://SEU_IP_DA_VPS,http://localhost
   
   # --- STRIPE (Pode deixar placeholder por enquanto) ---
   STRIPE_SECRET_KEY=sk_test_placeholder
   STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
   STRIPE_WEBHOOK_SECRET=whsec_placeholder
   ```
   **Importante:** Troque `SEU_IP_DA_VPS` pelo IP real da sua máquina.

3. Para salvar:
   - Aperte `Ctrl + O` e depois `Enter`.
   - Aperte `Ctrl + X` para sair.

4. Atualize a URL do Frontend:
   Você precisa avisar o Frontend onde está o Backend.
   ```bash
   nano .env.production
   ```
   Cole:
   ```ini
   VITE_API_URL=https://api.adsradar.pro
   ```
   Salve (`Ctrl+O`, `Enter`, `Ctrl+X`).

---

## Passo 4: Colocar no Ar (A Mágica)

Agora vamos ligar tudo (Site, Banco, Backend, Fila).

1. Rode o comando:
   ```bash
   docker compose up -d --build
   ```
   *Vai demorar uns 3 a 5 minutos pois ele vai baixar e instalar tudo.*

2. Quando terminar, verifique se está tudo rodando:
   ```bash
   docker compose ps
   ```
   Você deve ver 5 serviços com status "Up".

3. **Crie o Admin Inicial**:
   ```bash
   docker compose exec api python reset_admin.py
   ```
   Isso vai resetar o banco e criar o admin padrão.

---

## Passo 5: Testar

Abra seu navegador e digite:
- **Site:** `http://SEU_IP_DA_VPS:3000`
- **Backend:** `http://SEU_IP_DA_VPS:8001/docs`

Se a tela de login aparecer, **PARABÉNS!** Você tem um SaaS rodando em produção com Banco de Dados real, Sistema de Filas e tudo mais.

---

### Comandos Úteis para o Dia a Dia

- **Atualizar o Site (se você mudou código):**
  ```bash
  git pull
  docker compose up -d --build
  ```
- **Ver logs de erro:**
  ```bash
  docker compose logs -f api
  ```
