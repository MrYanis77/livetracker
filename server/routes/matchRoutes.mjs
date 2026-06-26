import { Router } from "express";
import * as ctrl from "../controllers/matchController.mjs";

const router = Router();

// ── Routes Matches ──
// GET  /api/matches                → Tous (+ ?status=, ?group=, ?teamId=, ?stadiumId=)
// GET  /api/matches/live           → Matchs en cours
// GET  /api/matches/finished       → Matchs terminés
// GET  /api/matches/scheduled      → Matchs programmés
// GET  /api/matches/stats/count    → Statistiques
// GET  /api/matches/:id            → Un match par id
// POST /api/matches                → Créer un match
// PUT  /api/matches/:id            → Modifier un match
// PUT  /api/matches/:id/score      → Mettre à jour le score
// DEL  /api/matches/:id            → Supprimer un match

router.get("/live", ctrl.getLive);
router.get("/finished", ctrl.getFinished);
router.get("/scheduled", ctrl.getScheduled);
router.get("/stats/count", ctrl.getStats);
router.get("/", ctrl.getAll);
router.get("/:id/detail", ctrl.getDetail);
router.get("/:id", ctrl.getById);
router.post("/", ctrl.create);
router.put("/:id/score", ctrl.updateScore);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

export default router;
