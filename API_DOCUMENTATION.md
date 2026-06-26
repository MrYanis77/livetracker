# Live Match Tracker — API Documentation

This document describes the REST API exposed by the Express server (`server/app.mjs`).  
The API is the single interface between the backend (Node.js + MongoDB) and any frontend client.  
There is no authentication — all endpoints are public.

---

## Server setup

```
Base URL : http://localhost:3000
Content-Type : application/json (all requests and responses)
CORS       : enabled for all origins (app.use(cors()))
```

Start the server:
```bash
npm run server          # backend only
npm run dev:all         # backend + Vite frontend (dev)
```

Environment variables (copy `.env.example` → `.env`):
```
MONGO_URI="mongodb://localhost:27017/livematch"
PORT=3000
FOOTBALL_DATA_API_KEY="..."   # optional, only for external sync
```

---

## Common response envelope

Every endpoint returns the same JSON shape:

```jsonc
// Success — list
{ "success": true, "count": 12, "data": [ ... ] }

// Success — single item
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": "message" }
```

HTTP status codes used:
- `200` — OK
- `201` — Created
- `400` — Bad request (missing required field)
- `403` — Forbidden (e.g. editing a finished match)
- `404` — Not found
- `500` — Server error

---

## Data model overview

```
Team ──< Player
Team ──< Match (as homeTeam / awayTeam)
Match ──< MatchEvent
Match ──< FanVote ──< VoteEvent
Stadium ──< Match
Supporter ──< VoteEvent
```

All `id` fields are plain strings (e.g. `"team_fra"`, `"match_001"`), **not** MongoDB ObjectIds.

---

## TypeScript types (ready to paste)

```typescript
// ── Primitives ─────────────────────────────────────────────────────────────

export type MatchStatus = "scheduled" | "live" | "finished";

export type EventType =
  | "goal"
  | "yellow_card"
  | "red_card"
  | "substitution"
  | "kickoff"
  | "half_time"
  | "full_time";

export type PlayerPosition = "Gardien" | "Défenseur" | "Milieu" | "Attaquant";

export type VoteType = "player_of_the_match" | "next_goal_scorer" | "team_vote";

export type VoteStatus = "open" | "closed";

// ── Entities ───────────────────────────────────────────────────────────────

export interface Team {
  id: string;            // "team_fra"
  name: string;          // "France"
  code: string;          // "FRA"
  continent: string;     // "Europe"
  group: string;         // "A"
  coach: string;
  colors: string[];      // ["#002395", "#FFFFFF", "#ED2939"]
  style: string;         // tactical description
  seed: number;
}

export interface Player {
  id: string;
  name: string;
  teamId: string;
  teamCode: string;
  number: number;
  position: PlayerPosition;
  role: string;          // "finisseur", "gardien réflexe", …
  age: number;
  heightCm: number;
  preferredFoot: string; // "right" | "left" | "both"
  stats: {
    attack: number;      // 0–100
    defense: number;
    speed: number;
    technique: number;
    stamina: number;
  };
  tags: string[];        // ["titulaire", "rotation"]
}

export interface Stadium {
  id: string;
  name: string;
  city: string;
  country: string;
  capacity: number;
}

export interface Match {
  id: string;            // "match_001"
  phase: string;         // "group_stage"
  group: string;         // "A"
  homeTeamId: string;
  awayTeamId: string;
  stadiumId: string;
  kickoff: string;       // ISO 8601
  status: MatchStatus;
  score: { home: number; away: number };
}

export interface MatchEvent {
  id: string;
  matchId: string;
  eventTime: string;     // ISO 8601
  minute: number;
  eventType: EventType;
  teamId: string | null;
  playerId: string | null;
  description: string;
  scoreAfter: { home: number; away: number };
}

export interface Supporter {
  id: string;
  username: string;
  displayName: string;
  country: string;
  favoriteTeamIds: string[];
  followedMatchIds: string[];
  interests: string[];   // ["buts", "statistiques"]
}

export interface FanVote {
  id: string;
  matchId: string;
  title: string;
  voteType: VoteType;
  status: VoteStatus;
  options: Array<{
    optionId: string;    // playerId or teamId
    label: string;
  }>;
}

export interface VoteEvent {
  id: string;
  voteId: string;
  voteTime: string;      // ISO 8601
  supporterId: string;
  optionId: string;
  device: "mobile" | "desktop";
}

// ── Composite response types ────────────────────────────────────────────────

export interface MatchDetailPayload {
  match: Match;
  homeTeam: Team;
  awayTeam: Team;
  stadium: Stadium | null;
  events: MatchEvent[];
  players: Record<string, Player>; // keyed by playerId
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  error?: string;
}
```

---

## Endpoints reference

### Teams  `/api/teams`

| Method | Path | Description | Query params |
|--------|------|-------------|--------------|
| GET | `/api/teams` | All teams | `group=A` \| `continent=Europe` |
| GET | `/api/teams/:id` | Single team | — |
| GET | `/api/teams/stats/count` | `{ total, groups }` | — |
| POST | `/api/teams` | Create team | body: Team fields |
| PUT | `/api/teams/:id` | Update team | body: partial Team |
| DELETE | `/api/teams/:id` | Delete team | — |

**GET /api/teams** — example response:
```json
{
  "success": true,
  "count": 8,
  "data": [
    {
      "id": "team_fra",
      "name": "France",
      "code": "FRA",
      "continent": "Europe",
      "group": "A",
      "coach": "Didier Deschamps",
      "colors": ["#002395", "#FFFFFF", "#ED2939"],
      "style": "Pressing haut, transitions rapides",
      "seed": 2
    }
  ]
}
```

---

### Players  `/api/players`

| Method | Path | Description | Query params |
|--------|------|-------------|--------------|
| GET | `/api/players` | All players | `teamId=team_fra` \| `position=Gardien` \| `search=mbappé` |
| GET | `/api/players/:id` | Single player | — |
| GET | `/api/players/titulaires` | Starters only (tag `titulaire`) | — |
| GET | `/api/players/top-attackers` | Top attack stat | `min=70` (default 70) |
| GET | `/api/players/fastest` | Top speed stat | `min=80` (default 80) |
| GET | `/api/players/stats/by-team` | Count per team | — |
| GET | `/api/players/stats/avg-age` | Avg age per team | — |
| GET | `/api/players/stats/by-position` | Avg stats per position | — |
| POST | `/api/players` | Create player | body: Player fields |
| PUT | `/api/players/:id` | Update player | body: partial Player |
| DELETE | `/api/players/:id` | Delete player | — |

**GET /api/players?teamId=team_fra** — example response:
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "player_fra_01",
      "name": "Kylian Mbappé",
      "teamId": "team_fra",
      "teamCode": "FRA",
      "number": 10,
      "position": "Attaquant",
      "role": "finisseur",
      "age": 25,
      "heightCm": 178,
      "preferredFoot": "right",
      "stats": { "attack": 95, "defense": 40, "speed": 97, "technique": 92, "stamina": 85 },
      "tags": ["titulaire"]
    }
  ]
}
```

---

### Matches  `/api/matches`

| Method | Path | Description | Query params |
|--------|------|-------------|--------------|
| GET | `/api/matches` | All matches | `status=live` \| `group=A` \| `teamId=team_fra` \| `stadiumId=stadium_01` |
| GET | `/api/matches/live` | Status = live | — |
| GET | `/api/matches/finished` | Status = finished | — |
| GET | `/api/matches/scheduled` | Status = scheduled | — |
| GET | `/api/matches/:id` | Single match (flat) | — |
| GET | `/api/matches/:id/detail` | **Enriched match** (see below) | — |
| GET | `/api/matches/stats/count` | `{ total, byStatus, byGroup }` | — |
| POST | `/api/matches` | Create match | body: Match fields |
| PUT | `/api/matches/:id` | Update match | body: partial Match |
| PUT | `/api/matches/:id/score` | Update score | body: `{ home, away, status? }` |
| DELETE | `/api/matches/:id` | Delete match | — |

**GET /api/matches/:id/detail** — the most useful endpoint for a match view.  
Returns match + both teams + stadium + all events + a player map for quick lookup.

```json
{
  "success": true,
  "data": {
    "match": {
      "id": "match_001",
      "phase": "group_stage",
      "group": "A",
      "homeTeamId": "team_fra",
      "awayTeamId": "team_bra",
      "stadiumId": "stadium_01",
      "kickoff": "2026-06-12T18:00:00Z",
      "status": "finished",
      "score": { "home": 2, "away": 1 }
    },
    "homeTeam": { "id": "team_fra", "name": "France", "code": "FRA", "colors": ["#002395"] },
    "awayTeam": { "id": "team_bra", "name": "Brazil", "code": "BRA", "colors": ["#009C3B"] },
    "stadium": { "id": "stadium_01", "name": "Stade de France", "city": "Saint-Denis", "country": "France", "capacity": 80000 },
    "events": [
      {
        "id": "evt_001",
        "matchId": "match_001",
        "eventTime": "2026-06-12T18:00:00Z",
        "minute": 0,
        "eventType": "kickoff",
        "teamId": null,
        "playerId": null,
        "description": "Coup d'envoi",
        "scoreAfter": { "home": 0, "away": 0 }
      }
    ],
    "players": {
      "player_fra_01": { "id": "player_fra_01", "name": "Kylian Mbappé" }
    }
  }
}
```

---

### Match Events  `/api/match-events`

| Method | Path | Description | Query params |
|--------|------|-------------|--------------|
| GET | `/api/match-events` | All events | `matchId=match_001` \| `eventType=goal` \| `playerId=player_fra_01` \| `teamId=team_fra` |
| GET | `/api/match-events/:id` | Single event | — |
| GET | `/api/match-events/goals/:matchId` | Goals only for a match | — |
| GET | `/api/match-events/stats/top-scorers` | Top scorers leaderboard | — |
| GET | `/api/match-events/stats/by-type` | Event count by type | — |
| POST | `/api/match-events` | Create event | body: MatchEvent fields (match must not be `finished`) |
| PUT | `/api/match-events/:id` | Update event | body: partial MatchEvent |
| DELETE | `/api/match-events/:id` | Delete event | — |

**Note:** Creating or deleting events on a match with `status: "finished"` returns `403`.

Event types: `goal` `yellow_card` `red_card` `substitution` `kickoff` `half_time` `full_time`

---

### Stadiums  `/api/stadiums`

| Method | Path | Description | Query params |
|--------|------|-------------|--------------|
| GET | `/api/stadiums` | All stadiums | `country=France` \| `minCapacity=50000` |
| GET | `/api/stadiums/:id` | Single stadium | — |
| GET | `/api/stadiums/stats/capacity` | Total capacity | — |
| POST | `/api/stadiums` | Create stadium | body: Stadium fields |
| PUT | `/api/stadiums/:id` | Update stadium | body: partial Stadium |
| DELETE | `/api/stadiums/:id` | Delete stadium | — |

---

### Supporters  `/api/supporters`

| Method | Path | Description | Query params |
|--------|------|-------------|--------------|
| GET | `/api/supporters` | All supporters | `country=France` \| `teamId=team_fra` \| `matchId=match_001` \| `interest=buts` |
| GET | `/api/supporters/:id` | Single supporter | — |
| GET | `/api/supporters/stats/by-country` | Count per country | — |
| POST | `/api/supporters` | Create supporter | body: Supporter fields |
| PUT | `/api/supporters/:id` | Update supporter | body: partial Supporter |
| PUT | `/api/supporters/:id/favorite-team` | Add a favorite team | body: `{ teamId }` |
| PUT | `/api/supporters/:id/follow-match` | Follow a match | body: `{ matchId }` |
| DELETE | `/api/supporters/:id` | Delete supporter | — |

---

### Fan Votes  `/api/fan-votes`

| Method | Path | Description | Query params |
|--------|------|-------------|--------------|
| GET | `/api/fan-votes` | All votes | `matchId=match_001` \| `status=open` \| `voteType=player_of_the_match` |
| GET | `/api/fan-votes/:id` | Single vote | — |
| POST | `/api/fan-votes` | Create vote | body: FanVote fields |
| PUT | `/api/fan-votes/:id` | Update vote | body: partial FanVote |
| PUT | `/api/fan-votes/:id/close` | Close a vote | — |
| DELETE | `/api/fan-votes/:id` | Delete vote | — |

Vote types: `player_of_the_match` `next_goal_scorer` `team_vote`

---

### Vote Events  `/api/vote-events`

| Method | Path | Description | Query params |
|--------|------|-------------|--------------|
| GET | `/api/vote-events` | All vote events | `voteId=vote_001` \| `supporterId=sup_001` \| `device=mobile` |
| GET | `/api/vote-events/:id` | Single vote event | — |
| GET | `/api/vote-events/results/:voteId` | Aggregated results for a vote | — |
| GET | `/api/vote-events/stats/by-device` | Count by device | — |
| POST | `/api/vote-events` | Cast a vote | body: VoteEvent fields |
| PUT | `/api/vote-events/:id` | Update vote event | — |
| DELETE | `/api/vote-events/:id` | Delete vote event | — |

**GET /api/vote-events/results/:voteId** — example response:
```json
{
  "success": true,
  "data": [
    { "optionId": "player_fra_01", "label": "Mbappé", "count": 42 },
    { "optionId": "player_bra_02", "label": "Vinicius Jr", "count": 18 }
  ]
}
```

---

## Recommended fetch patterns for a web app

### Homepage: all matches with team names

Fetch all matches, then resolve team names client-side from a single teams call:

```typescript
const [matchesRes, teamsRes] = await Promise.all([
  fetch("http://localhost:3000/api/matches"),
  fetch("http://localhost:3000/api/teams"),
]);
const { data: matches } = await matchesRes.json();
const { data: teams }   = await teamsRes.json();

const teamMap = Object.fromEntries(teams.map(t => [t.id, t]));
// matches[0].homeTeamId → teamMap["team_fra"].name
```

### Match detail page

One call returns everything (match + teams + stadium + events + player map):

```typescript
const res = await fetch(`http://localhost:3000/api/matches/${matchId}/detail`);
const { data } = await res.json();
// data.match, data.homeTeam, data.awayTeam, data.stadium, data.events, data.players
```

### Live matches

```typescript
const res = await fetch("http://localhost:3000/api/matches/live");
const { data: liveMatches } = await res.json();
```

### Top scorers

```typescript
const res = await fetch("http://localhost:3000/api/match-events/stats/top-scorers");
const { data: topScorers } = await res.json();
// returns array of { playerId, playerName?, count } — exact shape depends on aggregation
```

### Team roster

```typescript
const res = await fetch(`http://localhost:3000/api/players?teamId=${teamId}`);
const { data: players } = await res.json();
```

### Open votes for a match

```typescript
const res = await fetch(`http://localhost:3000/api/fan-votes?matchId=${matchId}&status=open`);
const { data: votes } = await res.json();
```

---

## Important constraints

| Rule | Detail |
|------|--------|
| Finished match lock | Cannot create or delete events on a match with `status: "finished"` → `403` |
| No auth | All endpoints are open, no API key or JWT needed |
| No pagination | All list endpoints return the full collection |
| One filter at a time | On most list endpoints, only the first matching query param is applied (e.g. `?teamId=` wins over `?position=` if both are sent) |
| ID format | IDs are strings like `"team_fra"`, `"match_001"` — never MongoDB ObjectIds |

---

## Typical screens and their calls

| Screen | Primary calls |
|--------|--------------|
| Home / Dashboard | `GET /api/matches`, `GET /api/teams`, `GET /api/matches/live` |
| Match list | `GET /api/matches?status=finished` / `?status=scheduled` |
| Match detail | `GET /api/matches/:id/detail` |
| Team profile | `GET /api/teams/:id`, `GET /api/players?teamId=:id` |
| Player profile | `GET /api/players/:id` |
| Standings / Stats | `GET /api/teams`, `GET /api/match-events/stats/top-scorers` |
| Votes | `GET /api/fan-votes?matchId=:id&status=open`, `GET /api/vote-events/results/:voteId` |
| Admin / edit match | `PUT /api/matches/:id/score`, `POST /api/match-events` |
