import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB, closeDB } from "./config/db.mjs";

// Routes
import teamRoutes from "./routes/teamRoutes.mjs";
import playerRoutes from "./routes/playerRoutes.mjs";
import matchRoutes from "./routes/matchRoutes.mjs";
import stadiumRoutes from "./routes/stadiumRoutes.mjs";
import supporterRoutes from "./routes/supporterRoutes.mjs";
import fanVoteRoutes from "./routes/fanVoteRoutes.mjs";
import matchEventRoutes from "./routes/matchEventRoutes.mjs";
import voteEventRoutes from "./routes/voteEventRoutes.mjs";
import footballDataRoutes from "./routes/footballDataRoutes.mjs";
import footballRoutes from "./routes/footballRoutes.mjs";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──
app.use(cors());
app.use(express.json());

// ── Logger middleware ──
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// ── Routes API (Vue dans le MVC) ──
app.use("/api/teams", teamRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/stadiums", stadiumRoutes);
app.use("/api/supporters", supporterRoutes);
app.use("/api/fan-votes", fanVoteRoutes);
app.use("/api/match-events", matchEventRoutes);
app.use("/api/vote-events", voteEventRoutes);
app.use("/api/football-data", footballDataRoutes);
app.use("/api/football", footballRoutes);

// ── Route racine : documentation API ──
app.get("/", (req, res) => {
  res.json({
    message: "🏟️ Live Match Tracker API — MVC MongoDB",
    database: "livematch",
    endpoints: {
      teams: {
        "GET /api/teams": "Toutes les équipes (?group=A, ?continent=Europe)",
        "GET /api/teams/:id": "Une équipe",
        "GET /api/teams/stats/count": "Statistiques",
        "POST /api/teams": "Créer",
        "PUT /api/teams/:id": "Modifier",
        "DELETE /api/teams/:id": "Supprimer",
      },
      players: {
        "GET /api/players": "Tous les joueurs (?teamId=, ?position=, ?search=)",
        "GET /api/players/:id": "Un joueur",
        "GET /api/players/titulaires": "Titulaires uniquement",
        "GET /api/players/top-attackers": "Top attaquants (?min=70)",
        "GET /api/players/fastest": "Plus rapides (?min=80)",
        "GET /api/players/stats/by-team": "Nombre par équipe",
        "GET /api/players/stats/avg-age": "Âge moyen par équipe",
        "GET /api/players/stats/by-position": "Stats moyennes par position",
        "POST /api/players": "Créer",
        "PUT /api/players/:id": "Modifier",
        "DELETE /api/players/:id": "Supprimer",
      },
      matches: {
        "GET /api/matches": "Tous (?status=, ?group=, ?teamId=, ?stadiumId=)",
        "GET /api/matches/:id": "Un match",
        "GET /api/matches/live": "En cours",
        "GET /api/matches/finished": "Terminés",
        "GET /api/matches/scheduled": "Programmés",
        "GET /api/matches/stats/count": "Statistiques",
        "POST /api/matches": "Créer",
        "PUT /api/matches/:id": "Modifier",
        "PUT /api/matches/:id/score": "Mettre à jour le score",
        "DELETE /api/matches/:id": "Supprimer",
      },
      stadiums: {
        "GET /api/stadiums": "Tous (?country=, ?minCapacity=)",
        "GET /api/stadiums/:id": "Un stade",
        "GET /api/stadiums/stats/capacity": "Capacité totale",
        "POST /api/stadiums": "Créer",
        "PUT /api/stadiums/:id": "Modifier",
        "DELETE /api/stadiums/:id": "Supprimer",
      },
      supporters: {
        "GET /api/supporters": "Tous (?country=, ?teamId=, ?matchId=, ?interest=)",
        "GET /api/supporters/:id": "Un supporter",
        "GET /api/supporters/stats/by-country": "Par pays",
        "POST /api/supporters": "Créer",
        "PUT /api/supporters/:id": "Modifier",
        "PUT /api/supporters/:id/favorite-team": "Ajouter équipe favorite",
        "PUT /api/supporters/:id/follow-match": "Suivre un match",
        "DELETE /api/supporters/:id": "Supprimer",
      },
      fanVotes: {
        "GET /api/fan-votes": "Tous (?matchId=, ?status=, ?voteType=)",
        "GET /api/fan-votes/:id": "Un vote",
        "POST /api/fan-votes": "Créer",
        "PUT /api/fan-votes/:id": "Modifier",
        "PUT /api/fan-votes/:id/close": "Fermer un vote",
        "DELETE /api/fan-votes/:id": "Supprimer",
      },
      matchEvents: {
        "GET /api/match-events": "Tous (?matchId=, ?eventType=, ?playerId=, ?teamId=)",
        "GET /api/match-events/:id": "Un événement",
        "GET /api/match-events/goals/:matchId": "Buts d'un match",
        "GET /api/match-events/stats/top-scorers": "Classement buteurs",
        "GET /api/match-events/stats/by-type": "Par type d'événement",
        "POST /api/match-events": "Créer",
        "PUT /api/match-events/:id": "Modifier",
        "DELETE /api/match-events/:id": "Supprimer",
      },
      voteEvents: {
        "GET /api/vote-events": "Tous (?voteId=, ?supporterId=, ?device=)",
        "GET /api/vote-events/:id": "Un vote event",
        "GET /api/vote-events/results/:voteId": "Résultats d'un vote",
        "GET /api/vote-events/stats/by-device": "Stats par appareil",
        "POST /api/vote-events": "Créer",
        "PUT /api/vote-events/:id": "Modifier",
        "DELETE /api/vote-events/:id": "Supprimer",
      },
    },
  });
});

// ── 404 ──
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route non trouvée" });
});

// ── Démarrage ──
async function start() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`\n🚀 Serveur MVC démarré sur http://localhost:${PORT}`);
      console.log(`📖 Documentation API : http://localhost:${PORT}/`);
      console.log(`📦 Base de données : livematch\n`);
    });
  } catch (err) {
    console.error("❌ Erreur de démarrage :", err);
    process.exit(1);
  }
}

// Gestion propre de l'arrêt
process.on("SIGINT", async () => {
  console.log("\n⏹️  Arrêt du serveur...");
  await closeDB();
  process.exit(0);
});

start();
