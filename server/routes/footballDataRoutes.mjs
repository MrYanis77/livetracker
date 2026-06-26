import { Router } from "express";
import * as ctrl from "../controllers/footballDataController.mjs";

const router = Router();

router.get("/matches/today", ctrl.getToday);
router.get("/matches/:id", ctrl.getById);
router.get("/matches", ctrl.getByCompetition);

export default router;
