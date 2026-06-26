# Live Match Tracker

Application de suivi de matchs de football en temps réel. Permet de suivre les scores, les événements de match (buts, cartons, remplacements), les classements, et les votes des supporters.

## Stack

| Couche | Technologie |
|--------|-------------|
| Backend | Node.js + Express 5 (ES Modules) |
| Base de données | MongoDB (driver natif) |
| Frontend | React 18 + TypeScript + Vite |
| UI | Tailwind CSS 4 + shadcn/ui (Radix) |
| Charts | Recharts |

## Prérequis

- Node.js ≥ 18
- MongoDB en local (port `27017` par défaut)

## Installation

```bash
npm install
cp .env.example .env
```

Éditer `.env` :

```
MONGO_URI="mongodb://localhost:27017/livematch"
PORT=3000
FOOTBALL_DATA_API_KEY=""   # optionnel, voir section API externe
```

## Base de données

Peupler la DB avec les données fictives (World Cup 2026) :

```bash
npm run seed
```

Le script recrée toutes les collections à chaque exécution — la DB peut être reconstruite de zéro à tout moment.

## Lancer le projet

```bash
# Backend + frontend (développement)
npm run dev:all

# Backend seul
npm run server

# Frontend seul (Vite dev server)
npm run dev
```

Le serveur Express écoute sur `http://localhost:3000`.  
L'interface React est servie par Vite sur `http://localhost:5173`.

## Structure

```
livetracker/
├── server/                 # Backend Express (MVC)
│   ├── app.mjs             # Point d'entrée, config CORS & routes
│   ├── config/db.mjs       # Connexion MongoDB (singleton)
│   ├── models/             # Accès aux données (8 collections)
│   ├── controllers/        # Logique métier
│   └── routes/             # Définition des endpoints
├── src/                    # Frontend React + TypeScript
│   └── app/
│       ├── App.tsx
│       ├── api/client.ts   # Fonctions fetch vers l'API
│       ├── types/match.ts  # Interfaces TypeScript
│       └── components/
├── scripts/
│   ├── seed.mjs            # Peuple la DB depuis worldcup_data.json
│   └── sync-football-data.mjs
├── data/
│   └── worldcup_data.json  # Dataset fictif (équipes, joueurs, matchs…)
└── API_DOCUMENTATION.md    # Référence complète de l'API REST
```

## Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev:all` | Lance le backend et Vite en parallèle |
| `npm run server` | Lance le backend uniquement |
| `npm run dev` | Lance Vite uniquement |
| `npm run seed` | Recrée la DB depuis `worldcup_data.json` |
| `npm run sync:football` | Synchronise les données depuis football-data.org |
| `npm run build` | Build de production (frontend) |

## API

L'API REST est exposée sur `http://localhost:3000/api`.  
CORS activé pour toutes les origines — aucune authentification requise.

Collections disponibles : `teams`, `players`, `matches`, `match-events`, `stadiums`, `supporters`, `fan-votes`, `vote-events`.

Documentation complète : [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## API externe (optionnel)

Le projet peut se connecter à [football-data.org](https://www.football-data.org/) pour récupérer de vrais matchs (Premier League, Liga, Champions League…).

1. Créer un compte gratuit sur football-data.org
2. Ajouter la clé dans `.env` : `FOOTBALL_DATA_API_KEY="ta_clé"`
3. Lancer la synchronisation : `npm run sync:football`

Sans cette clé, l'application fonctionne entièrement avec les données locales.
