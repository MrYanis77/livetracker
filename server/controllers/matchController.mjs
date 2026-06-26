import * as MatchModel from "../models/matchModel.mjs";
import * as TeamModel from "../models/teamModel.mjs";
import * as PlayerModel from "../models/playerModel.mjs";
import * as MatchEventModel from "../models/matchEventModel.mjs";
import * as StadiumModel from "../models/stadiumModel.mjs";

// ─────────────────────────────────────────────
//  CONTROLLER : Matches
// ─────────────────────────────────────────────

// GET /api/matches
export async function getAll(req, res) {
  try {
    const { status, group, teamId, stadiumId } = req.query;

    let matches;
    if (status) {
      matches = await MatchModel.findByStatus(status);
    } else if (group) {
      matches = await MatchModel.findByGroup(group);
    } else if (teamId) {
      matches = await MatchModel.findByTeamId(teamId);
    } else if (stadiumId) {
      matches = await MatchModel.findByStadiumId(stadiumId);
    } else {
      matches = await MatchModel.findAll();
    }

    res.json({ success: true, count: matches.length, data: matches });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/matches/:id/detail — match enrichi (équipes, événements, joueurs)
export async function getDetail(req, res) {
  try {
    const match = await MatchModel.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, error: "Match non trouvé" });

    const [homeTeam, awayTeam, events, stadium] = await Promise.all([
      TeamModel.findById(match.homeTeamId),
      TeamModel.findById(match.awayTeamId),
      MatchEventModel.findByMatchId(match.id),
      match.stadiumId ? StadiumModel.findById(match.stadiumId) : null,
    ]);

    const playerIds = [...new Set(events.filter((e) => e.playerId).map((e) => e.playerId))];
    const players = playerIds.length
      ? await Promise.all(playerIds.map((id) => PlayerModel.findById(id)))
      : [];
    const playerMap = Object.fromEntries(players.filter(Boolean).map((p) => [p.id, p]));

    res.json({
      success: true,
      data: { match, homeTeam, awayTeam, stadium, events, players: playerMap },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/matches/:id
export async function getById(req, res) {
  try {
    const match = await MatchModel.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, error: "Match non trouvé" });
    res.json({ success: true, data: match });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/matches/live
export async function getLive(req, res) {
  try {
    const matches = await MatchModel.findLive();
    res.json({ success: true, count: matches.length, data: matches });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/matches/finished
export async function getFinished(req, res) {
  try {
    const matches = await MatchModel.findFinished();
    res.json({ success: true, count: matches.length, data: matches });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/matches/scheduled
export async function getScheduled(req, res) {
  try {
    const matches = await MatchModel.findScheduled();
    res.json({ success: true, count: matches.length, data: matches });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// PUT /api/matches/:id/score
export async function updateScore(req, res) {
  try {
    const { home, away, status } = req.body;
    if (home === undefined || away === undefined) {
      return res.status(400).json({ success: false, error: "home et away sont requis" });
    }
    const match = await MatchModel.updateScore(req.params.id, home, away, status);
    if (!match) return res.status(404).json({ success: false, error: "Match non trouvé" });
    res.json({ success: true, data: match });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// POST /api/matches
export async function create(req, res) {
  try {
    const match = await MatchModel.create(req.body);
    res.status(201).json({ success: true, data: match });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// PUT /api/matches/:id
export async function update(req, res) {
  try {
    const match = await MatchModel.updateById(req.params.id, req.body);
    if (!match) return res.status(404).json({ success: false, error: "Match non trouvé" });
    res.json({ success: true, data: match });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// DELETE /api/matches/:id
export async function remove(req, res) {
  try {
    const deleted = await MatchModel.deleteById(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: "Match non trouvé" });
    res.json({ success: true, message: "Match supprimé" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/matches/stats/count
export async function getStats(req, res) {
  try {
    const total = await MatchModel.count();
    const byStatus = await MatchModel.countByStatus();
    const byGroup = await MatchModel.countByGroup();
    res.json({ success: true, data: { total, byStatus, byGroup } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
