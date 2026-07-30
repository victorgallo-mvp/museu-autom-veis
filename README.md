# Museu de Automoveis Antigos - Sistema de Gestao de Visitas

Sistema interno de agendamento de visitas, controle financeiro e calculo de comissao do guia para o museu de automoveis antigos em Carmo da Mata (MG).

## Estrutura

```
/
├── api/    # backend Node/Express + Prisma + PostgreSQL
├── web/    # frontend React/Vite + Tailwind
```

## Rodando localmente

### Backend (api/)

```bash
cd api
npm install
cp .env.example .env   # preencher DATABASE_URL, JWT_SECRET, SEED_EMAIL, SEED_PASSWORD
npx prisma migrate dev
npm run seed
npm run dev
```

A API sobe em `http://localhost:3333`.

### Frontend (web/)

```bash
cd web
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:3333
npm run dev
```

O frontend sobe em `http://localhost:5173`.

## Variaveis de ambiente

### api/.env

```
DATABASE_URL=
JWT_SECRET=
SEED_EMAIL=
SEED_PASSWORD=
PORT=3333
CORS_ORIGIN=
```

- `SEED_EMAIL` / `SEED_PASSWORD`: credenciais do usuario compartilhado, usadas pelo script `npm run seed`.
- `CORS_ORIGIN`: URL do frontend (local ou produção) autorizada a chamar a API.

### web/.env

```
VITE_API_URL=
```

- URL base da API que o frontend deve chamar.

## Deploy

Monorepo com dois projetos deployados separadamente a partir do mesmo repositorio GitHub.

### Backend no Railway

1. Criar um projeto no Railway a partir do repositorio GitHub.
2. No servico da API, em **Settings → Root Directory**, definir `api`.
3. Adicionar um servico Postgres ao mesmo projeto Railway.
4. Nas **Variables** do servico da API, configurar:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=<string aleatoria>
   SEED_EMAIL=<email de login>
   SEED_PASSWORD=<senha de login>
   CORS_ORIGIN=<URL do frontend no Vercel>
   ```
   (nao definir `PORT` manualmente — o Railway injeta a propria variavel).
5. Gerar um dominio publico em **Settings → Networking → Generate Domain**.
6. Rodar a migration inicial e o seed apontando `DATABASE_URL` para a URL publica do Postgres do Railway:
   ```bash
   cd api
   npx prisma migrate dev
   npm run seed
   ```

### Frontend no Vercel

1. Criar um projeto no Vercel a partir do mesmo repositorio GitHub.
2. Em **Settings → General → Root Directory**, definir `web` (essencial: sem isso o Vercel tenta tratar a pasta `api/` como Serverless Functions e o deploy falha).
3. Em **Settings → Environment Variables**, adicionar:
   ```
   VITE_API_URL=<dominio publico da API no Railway>
   ```
4. Deploy.
5. Depois do primeiro deploy, voltar no Railway e atualizar `CORS_ORIGIN` do servico da API com a URL gerada pelo Vercel.
