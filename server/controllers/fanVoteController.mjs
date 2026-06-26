import * as FanVoteModel from "../models/fanVoteModel.mjs";

// ─────────────────────────────────────────────
//  CONTROLLER : FanVotes
// ─────────────────────────────────────────────

// GET /api/fan-votes
export async function getAll(req, res) {
  try {
    const { matchId, status, voteType } = req.query;

    let votes;
    if (matchId) {
      votes = await FanVoteModel.findByMatchId(matchId);
    } else if (status) {
      votes = await FanVoteModel.findByStatus(status);
    } else if (voteType) {
      votes = await FanVoteModel.findByType(voteType);
    } else {
      votes = await FanVoteModel.findAll();
    }

    res.json({ success: true, count: votes.length, data: votes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/fan-votes/:id
export async function getById(req, res) {
  try {
    const vote = await FanVoteModel.findById(req.params.id);
    if (!vote) return res.status(404).json({ success: false, error: "Vote non trouvé" });
    res.json({ success: true, data: vote });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// POST /api/fan-votes
export async function create(req, res) {
  try {
    const vote = await FanVoteModel.create(req.body);
    res.status(201).json({ success: true, data: vote });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// PUT /api/fan-votes/:id
export async function update(req, res) {
  try {
    const vote = await FanVoteModel.updateById(req.params.id, req.body);
    if (!vote) return res.status(404).json({ success: false, error: "Vote non trouvé" });
    res.json({ success: true, data: vote });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// PUT /api/fan-votes/:id/close
export async function close(req, res) {
  try {
    const vote = await FanVoteModel.closeVote(req.params.id);
    if (!vote) return res.status(404).json({ success: false, error: "Vote non trouvé" });
    res.json({ success: true, data: vote });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// DELETE /api/fan-votes/:id
export async function remove(req, res) {
  try {
    const deleted = await FanVoteModel.deleteById(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: "Vote non trouvé" });
    res.json({ success: true, message: "Vote supprimé" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
