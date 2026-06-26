import { Router } from "express";
import * as ctrl from "../controllers/voteEventController.mjs";

const router = Router();

// ── Routes VoteEvents ──
// GET  /api/vote-events                      → Tous (+ ?voteId=, ?supporterId=, ?device=)
// GET  /api/vote-events/results/:voteId      → Résultats d'un vote (comptage par option)
// GET  /api/vote-events/stats/by-device      → Statistiques par appareil
// GET  /api/vote-events/:id                  → Un vote event par id
// POST /api/vote-events                      → Créer un vote event
// PUT  /api/vote-events/:id                  → Modifier un vote event
// DEL  /api/vote-events/:id                  → Supprimer un vote event

router.get("/results/:voteId", ctrl.getResults);
router.get("/stats/by-device", ctrl.getStatsByDevice);
router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getById);
router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

export default router;
