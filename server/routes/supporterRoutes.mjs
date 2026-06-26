import { Router } from "express";
import * as ctrl from "../controllers/supporterController.mjs";

const router = Router();

// ── Routes Supporters ──
// GET  /api/supporters                      → Tous (+ ?country=, ?teamId=, ?matchId=, ?interest=)
// GET  /api/supporters/stats/by-country     → Statistiques par pays
// GET  /api/supporters/:id                  → Un supporter par id
// POST /api/supporters                      → Créer un supporter
// PUT  /api/supporters/:id                  → Modifier un supporter
// PUT  /api/supporters/:id/favorite-team    → Ajouter une équipe favorite
// PUT  /api/supporters/:id/follow-match     → Suivre un match
// DEL  /api/supporters/:id                  → Supprimer un supporter

router.get("/stats/by-country", ctrl.getStatsByCountry);
router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getById);
router.post("/", ctrl.create);
router.put("/:id/favorite-team", ctrl.addFavoriteTeam);
router.put("/:id/follow-match", ctrl.followMatch);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

export default router;
