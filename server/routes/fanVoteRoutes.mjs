import { Router } from "express";
import * as ctrl from "../controllers/fanVoteController.mjs";

const router = Router();

// ── Routes FanVotes ──
// GET  /api/fan-votes              → Tous (+ ?matchId=, ?status=, ?voteType=)
// GET  /api/fan-votes/:id          → Un vote par id
// POST /api/fan-votes              → Créer un vote
// PUT  /api/fan-votes/:id          → Modifier un vote
// PUT  /api/fan-votes/:id/close    → Fermer un vote
// DEL  /api/fan-votes/:id          → Supprimer un vote

router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getById);
router.post("/", ctrl.create);
router.put("/:id/close", ctrl.close);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

export default router;
