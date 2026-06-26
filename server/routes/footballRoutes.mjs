import { Router } from "express";
import * as ctrl from "../controllers/footballDbController.mjs";

const router = Router();

router.get("/stats", ctrl.getStats);
router.post("/sync", ctrl.triggerSync);
router.get("/competitions", ctrl.getCompetitions);
router.get("/matches/live", ctrl.getLiveMatches);
router.get("/matches/:id/detail", ctrl.getMatchDetail);
router.get("/matches", ctrl.getMatches);
router.post("/events", ctrl.createEvent);
router.delete("/events/:id", ctrl.deleteEvent);
router.get("/standings/:code", ctrl.getStandings);
router.get("/scorers/:code", ctrl.getScorers);

export default router;
