import { Router } from "express";
import * as ctrl from "../controllers/playerController.mjs";

const router = Router();

// ── Routes Players ──
// GET  /api/players                    → Tous (+ ?teamId=, ?position=, ?search=)
// GET  /api/players/titulaires         → Titulaires uniquement
// GET  /api/players/top-attackers      → Meilleurs attaquants (+ ?min=70)
// GET  /api/players/fastest            → Joueurs les plus rapides (+ ?min=80)
// GET  /api/players/stats/by-team      → Nombre de joueurs par équipe
// GET  /api/players/stats/avg-age      → Âge moyen par équipe
// GET  /api/players/stats/by-position  → Stats moyennes par position
// GET  /api/players/:id                → Un joueur par id
// POST /api/players                    → Créer un joueur
// PUT  /api/players/:id                → Modifier un joueur
// DEL  /api/players/:id                → Supprimer un joueur

router.get("/titulaires", ctrl.getTitulaires);
router.get("/top-attackers", ctrl.getTopAttackers);
router.get("/fastest", ctrl.getFastest);
router.get("/stats/by-team", ctrl.getCountByTeam);
router.get("/stats/avg-age", ctrl.getAvgAge);
router.get("/stats/by-position", ctrl.getStatsByPosition);
router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getById);
router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

export default router;
