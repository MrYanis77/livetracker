import * as TeamModel from "../models/teamModel.mjs";

// ─────────────────────────────────────────────
//  CONTROLLER : Teams
// ─────────────────────────────────────────────

// GET /api/teams
export async function getAll(req, res) {
  try {
    const { group, continent } = req.query;

    let teams;
    if (group) {
      teams = await TeamModel.findByGroup(group);
    } else if (continent) {
      teams = await TeamModel.findByContinent(continent);
    } else {
      teams = await TeamModel.findAll();
    }

    res.json({ success: true, count: teams.length, data: teams });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/teams/:id
export async function getById(req, res) {
  try {
    const team = await TeamModel.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, error: "Équipe non trouvée" });
    res.json({ success: true, data: team });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// POST /api/teams
export async function create(req, res) {
  try {
    const team = await TeamModel.create(req.body);
    res.status(201).json({ success: true, data: team });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// PUT /api/teams/:id
export async function update(req, res) {
  try {
    const team = await TeamModel.updateById(req.params.id, req.body);
    if (!team) return res.status(404).json({ success: false, error: "Équipe non trouvée" });
    res.json({ success: true, data: team });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// DELETE /api/teams/:id
export async function remove(req, res) {
  try {
    const deleted = await TeamModel.deleteById(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: "Équipe non trouvée" });
    res.json({ success: true, message: "Équipe supprimée" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/teams/stats/count
export async function getCount(req, res) {
  try {
    const total = await TeamModel.count();
    const groups = await TeamModel.distinctGroups();
    res.json({ success: true, data: { total, groups } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
