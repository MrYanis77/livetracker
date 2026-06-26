import * as StadiumModel from "../models/stadiumModel.mjs";

// ─────────────────────────────────────────────
//  CONTROLLER : Stadiums
// ─────────────────────────────────────────────

// GET /api/stadiums
export async function getAll(req, res) {
  try {
    const { country, minCapacity } = req.query;

    let stadiums;
    if (country) {
      stadiums = await StadiumModel.findByCountry(country);
    } else if (minCapacity) {
      stadiums = await StadiumModel.findByMinCapacity(parseInt(minCapacity));
    } else {
      stadiums = await StadiumModel.findAll();
    }

    res.json({ success: true, count: stadiums.length, data: stadiums });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/stadiums/:id
export async function getById(req, res) {
  try {
    const stadium = await StadiumModel.findById(req.params.id);
    if (!stadium) return res.status(404).json({ success: false, error: "Stade non trouvé" });
    res.json({ success: true, data: stadium });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// POST /api/stadiums
export async function create(req, res) {
  try {
    const stadium = await StadiumModel.create(req.body);
    res.status(201).json({ success: true, data: stadium });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// PUT /api/stadiums/:id
export async function update(req, res) {
  try {
    const stadium = await StadiumModel.updateById(req.params.id, req.body);
    if (!stadium) return res.status(404).json({ success: false, error: "Stade non trouvé" });
    res.json({ success: true, data: stadium });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// DELETE /api/stadiums/:id
export async function remove(req, res) {
  try {
    const deleted = await StadiumModel.deleteById(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: "Stade non trouvé" });
    res.json({ success: true, message: "Stade supprimé" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/stadiums/stats/capacity
export async function getCapacityStats(req, res) {
  try {
    const total = await StadiumModel.count();
    const totalCapacity = await StadiumModel.totalCapacity();
    res.json({ success: true, data: { total, totalCapacity } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
