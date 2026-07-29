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

### Frontend (web/)

Documentado quando a etapa de frontend for iniciada.

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

### web/.env

```
VITE_API_URL=
```

## Deploy

Documentado quando as etapas de backend e frontend estiverem prontas para publicacao (Railway para api/, Vercel para web/).
