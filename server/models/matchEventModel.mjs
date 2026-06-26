import { getDB } from "../config/db.mjs";

// ─────────────────────────────────────────────
//  MODEL : MatchEvents
//  Équivalences SQL → MongoDB
// ─────────────────────────────────────────────

const COLLECTION = "matchEvents";

/** @returns {import("mongodb").Collection} */
function col() {
  return getDB().collection(COLLECTION);
}

// ── SELECT * FROM matchEvents ORDER BY eventTime ASC ──
export async function findAll() {
  return col().find({}).sort({ eventTime: 1 }).toArray();
}

// ── SELECT * FROM matchEvents WHERE id = ? ──
export async function findById(id) {
  return col().findOne({ id });
}

// ── SELECT * FROM matchEvents WHERE matchId = ? ORDER BY minute ASC ──
export async function findByMatchId(matchId) {
  return col().find({ matchId }).sort({ minute: 1 }).toArray();
}

// ── SELECT * FROM matchEvents WHERE eventType = ? ──
export async function findByType(eventType) {
  return col().find({ eventType }).sort({ eventTime: 1 }).toArray();
}

// ── SELECT * FROM matchEvents WHERE matchId = ? AND eventType = 'goal' ──
export async function findGoalsByMatch(matchId) {
  return col()
    .find({ matchId, eventType: "goal" })
    .sort({ minute: 1 })
    .toArray();
}

// ── SELECT * FROM matchEvents WHERE playerId = ? ──
export async function findByPlayerId(playerId) {
  return col().find({ playerId }).sort({ eventTime: 1 }).toArray();
}

// ── SELECT * FROM matchEvents WHERE teamId = ? ──
export async function findByTeamId(teamId) {
  return col().find({ teamId }).sort({ eventTime: 1 }).toArray();
}

// ── INSERT INTO matchEvents VALUES (...) ──
export async function create(eventData) {
  const result = await col().insertOne(eventData);
  return { ...eventData, _id: result.insertedId };
}

// ── UPDATE matchEvents SET ... WHERE id = ? ──
export async function updateById(id, updateData) {
  const result = await col().findOneAndUpdate(
    { id },
    { $set: updateData },
    { returnDocument: "after" }
  );
  return result;
}

// ── DELETE FROM matchEvents WHERE id = ? ──
export async function deleteById(id) {
  const result = await col().deleteOne({ id });
  return result.deletedCount > 0;
}

// ── SELECT COUNT(*) FROM matchEvents ──
export async function count() {
  return col().countDocuments();
}

// ── SELECT eventType, COUNT(*) FROM matchEvents GROUP BY eventType ──
export async function countByType() {
  return col()
    .aggregate([
      { $group: { _id: "$eventType", total: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ])
    .toArray();
}

// ── SELECT playerId, COUNT(*) as goals FROM matchEvents
//    WHERE eventType = 'goal' GROUP BY playerId ORDER BY goals DESC ──
export async function topScorers() {
  return col()
    .aggregate([
      { $match: { eventType: "goal" } },
      { $group: { _id: "$playerId", goals: { $sum: 1 } } },
      { $sort: { goals: -1 } },
    ])
    .toArray();
}
