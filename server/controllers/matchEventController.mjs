import * as MatchEventModel from "../models/matchEventModel.mjs";

// ─────────────────────────────────────────────
//  CONTROLLER : MatchEvents
// ─────────────────────────────────────────────

// GET /api/match-events
export async function getAll(req, res) {
  try {
    const { matchId, eventType, playerId, teamId } = req.query;

    let events;
    if (matchId) {
      events = await MatchEventModel.findByMatchId(matchId);
    } else if (eventType) {
      events = await MatchEventModel.findByType(eventType);
    } else if (playerId) {
      events = await MatchEventModel.findByPlayerId(playerId);
    } else if (teamId) {
      events = await MatchEventModel.findByTeamId(teamId);
    } else {
      events = await MatchEventModel.findAll();
    }

    res.json({ success: true, count: events.length, data: events });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/match-events/:id
export async function getById(req, res) {
  try {
    const event = await MatchEventModel.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, error: "Événement non trouvé" });
    res.json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/match-events/goals/:matchId
export async function getGoalsByMatch(req, res) {
  try {
    const goals = await MatchEventModel.findGoalsByMatch(req.params.matchId);
    res.json({ success: true, count: goals.length, data: goals });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/match-events/stats/top-scorers
export async function getTopScorers(req, res) {
  try {
    const data = await MatchEventModel.topScorers();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/match-events/stats/by-type
export async function getCountByType(req, res) {
  try {
    const data = await MatchEventModel.countByType();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

import * as MatchEventModel from "../models/matchEventModel.mjs";
import * as MatchModel from "../models/matchModel.mjs";

async function assertMatchEditable(matchId) {
  const match = await MatchModel.findById(matchId);
  if (!match) {
    const err = new Error("Match non trouvé");
    err.status = 404;
    throw err;
  }
  if (match.status === "finished") {
    const err = new Error("Impossible de modifier un match terminé");
    err.status = 403;
    throw err;
  }
  return match;
}

// POST /api/match-events
export async function create(req, res) {
  try {
    await assertMatchEditable(req.body.matchId);
    const event = await MatchEventModel.create(req.body);
    res.status(201).json({ success: true, data: event });
  } catch (err) {
    const status = err.status ?? 500;
    res.status(status).json({ success: false, error: err.message });
  }
}

// PUT /api/match-events/:id
export async function update(req, res) {
  try {
    const event = await MatchEventModel.updateById(req.params.id, req.body);
    if (!event) return res.status(404).json({ success: false, error: "Événement non trouvé" });
    res.json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// DELETE /api/match-events/:id
export async function remove(req, res) {
  try {
    const event = await MatchEventModel.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, error: "Événement non trouvé" });
    await assertMatchEditable(event.matchId);
    const deleted = await MatchEventModel.deleteById(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: "Événement non trouvé" });
    res.json({ success: true, message: "Événement supprimé" });
  } catch (err) {
    const status = err.status ?? 500;
    res.status(status).json({ success: false, error: err.message });
  }
}
