import { Router } from "express";
import * as ctrl from "../controllers/stadiumController.mjs";

const router = Router();

// ── Routes Stadiums ──
// GET  /api/stadiums                   → Tous (+ ?country=, ?minCapacity=)
// GET  /api/stadiums/stats/capacity    → Statistiques capacité
// GET  /api/stadiums/:id               → Un stade par id
// POST /api/stadiums                   → Créer un stade
// PUT  /api/stadiums/:id               → Modifier un stade
// DEL  /api/stadiums/:id               → Supprimer un stade

router.get("/stats/capacity", ctrl.getCapacityStats);
router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getById);
router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

export default router;
