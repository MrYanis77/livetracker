import { getDB } from "../config/db.mjs";

// ─────────────────────────────────────────────
//  MODEL : Matches
//  Équivalences SQL → MongoDB
// ─────────────────────────────────────────────

const COLLECTION = "matches";

/** @returns {import("mongodb").Collection} */
function col() {
  return getDB().collection(COLLECTION);
}

// ── SELECT * FROM matches ORDER BY kickoff ASC ──
export async function findAll() {
  return col().find({}).sort({ kickoff: 1 }).toArray();
}

// ── SELECT * FROM matches WHERE id = ? ──
export async function findById(id) {
  return col().findOne({ id });
}

// ── SELECT * FROM matches WHERE status = ? ──
export async function findByStatus(status) {
  return col().find({ status }).sort({ kickoff: 1 }).toArray();
}

// ── SELECT * FROM matches WHERE group = ? ──
export async function findByGroup(group) {
  return col().find({ group }).sort({ kickoff: 1 }).toArray();
}

// ── SELECT * FROM matches WHERE homeTeamId = ? OR awayTeamId = ? ──
export async function findByTeamId(teamId) {
  return col()
    .find({ $or: [{ homeTeamId: teamId }, { awayTeamId: teamId }] })
    .sort({ kickoff: 1 })
    .toArray();
}

// ── SELECT * FROM matches WHERE stadiumId = ? ──
export async function findByStadiumId(stadiumId) {
  return col().find({ stadiumId }).sort({ kickoff: 1 }).toArray();
}

// ── SELECT * FROM matches WHERE status = 'live' ──
export async function findLive() {
  return col().find({ status: "live" }).toArray();
}

// ── SELECT * FROM matches WHERE status = 'finished' ──
export async function findFinished() {
  return col().find({ status: "finished" }).sort({ kickoff: -1 }).toArray();
}

// ── SELECT * FROM matches WHERE status = 'scheduled' ORDER BY kickoff ──
export async function findScheduled() {
  return col().find({ status: "scheduled" }).sort({ kickoff: 1 }).toArray();
}

// ── UPDATE matches SET score = ?, status = ? WHERE id = ? ──
export async function updateScore(id, homeScore, awayScore, status = "live") {
  const result = await col().findOneAndUpdate(
    { id },
    {
      $set: {
        "score.home": homeScore,
        "score.away": awayScore,
        status,
      },
    },
    { returnDocument: "after" }
  );
  return result;
}

// ── INSERT INTO matches VALUES (...) ──
export async function create(matchData) {
  const result = await col().insertOne(matchData);
  return { ...matchData, _id: result.insertedId };
}

// ── UPDATE matches SET ... WHERE id = ? ──
export async function updateById(id, updateData) {
  const result = await col().findOneAndUpdate(
    { id },
    { $set: updateData },
    { returnDocument: "after" }
  );
  return result;
}

// ── DELETE FROM matches WHERE id = ? ──
export async function deleteById(id) {
  const result = await col().deleteOne({ id });
  return result.deletedCount > 0;
}

// ── SELECT COUNT(*) FROM matches ──
export async function count() {
  return col().countDocuments();
}

// ── SELECT COUNT(*) FROM matches GROUP BY status ──
export async function countByStatus() {
  return col()
    .aggregate([
      { $group: { _id: "$status", total: { $sum: 1 } } },
    ])
    .toArray();
}

// ── SELECT group, COUNT(*) FROM matches GROUP BY group ──
export async function countByGroup() {
  return col()
    .aggregate([
      { $group: { _id: "$group", total: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ])
    .toArray();
}
