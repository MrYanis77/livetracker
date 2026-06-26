import { Router } from "express";
import * as ctrl from "../controllers/teamController.mjs";

const router = Router();

// ── Routes Teams ──
// GET  /api/teams              → Toutes les équipes (+ ?group=A, ?continent=Europe)
// GET  /api/teams/stats/count  → Statistiques
// GET  /api/teams/:id          → Une équipe par id
// POST /api/teams              → Créer une équipe
// PUT  /api/teams/:id          → Modifier une équipe
// DEL  /api/teams/:id          → Supprimer une équipe

router.get("/stats/count", ctrl.getCount);
router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getById);
router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

export default router;
