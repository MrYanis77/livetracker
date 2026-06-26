import * as PlayerModel from "../models/playerModel.mjs";

// ─────────────────────────────────────────────
//  CONTROLLER : Players
// ─────────────────────────────────────────────

// GET /api/players
export async function getAll(req, res) {
  try {
    const { teamId, position, search } = req.query;

    let players;
    if (teamId) {
      players = await PlayerModel.findByTeamId(teamId);
    } else if (position) {
      players = await PlayerModel.findByPosition(position);
    } else if (search) {
      players = await PlayerModel.searchByName(search);
    } else {
      players = await PlayerModel.findAll();
    }

    res.json({ success: true, count: players.length, data: players });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/players/:id
export async function getById(req, res) {
  try {
    const player = await PlayerModel.findById(req.params.id);
    if (!player) return res.status(404).json({ success: false, error: "Joueur non trouvé" });
    res.json({ success: true, data: player });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/players/titulaires
export async function getTitulaires(req, res) {
  try {
    const players = await PlayerModel.findTitulaires();
    res.json({ success: true, count: players.length, data: players });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/players/top-attackers
export async function getTopAttackers(req, res) {
  try {
    const min = parseInt(req.query.min) || 70;
    const players = await PlayerModel.findTopAttackers(min);
    res.json({ success: true, count: players.length, data: players });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/players/fastest
export async function getFastest(req, res) {
  try {
    const min = parseInt(req.query.min) || 80;
    const players = await PlayerModel.findFastest(min);
    res.json({ success: true, count: players.length, data: players });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/players/stats/by-team
export async function getCountByTeam(req, res) {
  try {
    const data = await PlayerModel.countByTeam();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/players/stats/avg-age
export async function getAvgAge(req, res) {
  try {
    const data = await PlayerModel.avgAgeByTeam();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/players/stats/by-position
export async function getStatsByPosition(req, res) {
  try {
    const data = await PlayerModel.avgStatsByPosition();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// POST /api/players
export async function create(req, res) {
  try {
    const player = await PlayerModel.create(req.body);
    res.status(201).json({ success: true, data: player });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// PUT /api/players/:id
export async function update(req, res) {
  try {
    const player = await PlayerModel.updateById(req.params.id, req.body);
    if (!player) return res.status(404).json({ success: false, error: "Joueur non trouvé" });
    res.json({ success: true, data: player });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// DELETE /api/players/:id
export async function remove(req, res) {
  try {
    const deleted = await PlayerModel.deleteById(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: "Joueur non trouvé" });
    res.json({ success: true, message: "Joueur supprimé" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
