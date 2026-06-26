import * as VoteEventModel from "../models/voteEventModel.mjs";

// ─────────────────────────────────────────────
//  CONTROLLER : VoteEvents
// ─────────────────────────────────────────────

// GET /api/vote-events
export async function getAll(req, res) {
  try {
    const { voteId, supporterId, device } = req.query;

    let events;
    if (voteId) {
      events = await VoteEventModel.findByVoteId(voteId);
    } else if (supporterId) {
      events = await VoteEventModel.findBySupporterId(supporterId);
    } else if (device) {
      events = await VoteEventModel.findByDevice(device);
    } else {
      events = await VoteEventModel.findAll();
    }

    res.json({ success: true, count: events.length, data: events });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/vote-events/:id
export async function getById(req, res) {
  try {
    const event = await VoteEventModel.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, error: "Vote event non trouvé" });
    res.json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/vote-events/results/:voteId
export async function getResults(req, res) {
  try {
    const data = await VoteEventModel.countVotesByOption(req.params.voteId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/vote-events/stats/by-device
export async function getStatsByDevice(req, res) {
  try {
    const data = await VoteEventModel.countByDevice();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// POST /api/vote-events
export async function create(req, res) {
  try {
    const event = await VoteEventModel.create(req.body);
    res.status(201).json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// PUT /api/vote-events/:id
export async function update(req, res) {
  try {
    const event = await VoteEventModel.updateById(req.params.id, req.body);
    if (!event) return res.status(404).json({ success: false, error: "Vote event non trouvé" });
    res.json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// DELETE /api/vote-events/:id
export async function remove(req, res) {
  try {
    const deleted = await VoteEventModel.deleteById(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: "Vote event non trouvé" });
    res.json({ success: true, message: "Vote event supprimé" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
