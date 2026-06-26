import { Router } from "express";
import * as ctrl from "../controllers/matchEventController.mjs";

const router = Router();

// ── Routes MatchEvents ──
// GET  /api/match-events                      → Tous (+ ?matchId=, ?eventType=, ?playerId=, ?teamId=)
// GET  /api/match-events/goals/:matchId       → Buts d'un match
// GET  /api/match-events/stats/top-scorers    → Classement des buteurs
// GET  /api/match-events/stats/by-type        → Nombre d'événements par type
// GET  /api/match-events/:id                  → Un événement par id
// POST /api/match-events                      → Créer un événement
// PUT  /api/match-events/:id                  → Modifier un événement
// DEL  /api/match-events/:id                  → Supprimer un événement

router.get("/goals/:matchId", ctrl.getGoalsByMatch);
router.get("/stats/top-scorers", ctrl.getTopScorers);
router.get("/stats/by-type", ctrl.getCountByType);
router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getById);
router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

export default router;
