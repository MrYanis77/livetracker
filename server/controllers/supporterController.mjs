import * as SupporterModel from "../models/supporterModel.mjs";

// ─────────────────────────────────────────────
//  CONTROLLER : Supporters
// ─────────────────────────────────────────────

// GET /api/supporters
export async function getAll(req, res) {
  try {
    const { country, teamId, matchId, interest } = req.query;

    let supporters;
    if (country) {
      supporters = await SupporterModel.findByCountry(country);
    } else if (teamId) {
      supporters = await SupporterModel.findByFavoriteTeam(teamId);
    } else if (matchId) {
      supporters = await SupporterModel.findByFollowedMatch(matchId);
    } else if (interest) {
      supporters = await SupporterModel.findByInterest(interest);
    } else {
      supporters = await SupporterModel.findAll();
    }

    res.json({ success: true, count: supporters.length, data: supporters });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/supporters/:id
export async function getById(req, res) {
  try {
    const supporter = await SupporterModel.findById(req.params.id);
    if (!supporter) return res.status(404).json({ success: false, error: "Supporter non trouvé" });
    res.json({ success: true, data: supporter });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// POST /api/supporters
export async function create(req, res) {
  try {
    const supporter = await SupporterModel.create(req.body);
    res.status(201).json({ success: true, data: supporter });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// PUT /api/supporters/:id
export async function update(req, res) {
  try {
    const supporter = await SupporterModel.updateById(req.params.id, req.body);
    if (!supporter) return res.status(404).json({ success: false, error: "Supporter non trouvé" });
    res.json({ success: true, data: supporter });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// PUT /api/supporters/:id/favorite-team
export async function addFavoriteTeam(req, res) {
  try {
    const { teamId } = req.body;
    if (!teamId) return res.status(400).json({ success: false, error: "teamId requis" });
    const supporter = await SupporterModel.addFavoriteTeam(req.params.id, teamId);
    if (!supporter) return res.status(404).json({ success: false, error: "Supporter non trouvé" });
    res.json({ success: true, data: supporter });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// PUT /api/supporters/:id/follow-match
export async function followMatch(req, res) {
  try {
    const { matchId } = req.body;
    if (!matchId) return res.status(400).json({ success: false, error: "matchId requis" });
    const supporter = await SupporterModel.followMatch(req.params.id, matchId);
    if (!supporter) return res.status(404).json({ success: false, error: "Supporter non trouvé" });
    res.json({ success: true, data: supporter });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// DELETE /api/supporters/:id
export async function remove(req, res) {
  try {
    const deleted = await SupporterModel.deleteById(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: "Supporter non trouvé" });
    res.json({ success: true, message: "Supporter supprimé" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/supporters/stats/by-country
export async function getStatsByCountry(req, res) {
  try {
    const data = await SupporterModel.countByCountry();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
