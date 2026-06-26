import { getDB } from "../config/db.mjs";

// ─────────────────────────────────────────────
//  MODEL : VoteEvents
//  Équivalences SQL → MongoDB
// ─────────────────────────────────────────────

const COLLECTION = "voteEvents";

/** @returns {import("mongodb").Collection} */
function col() {
  return getDB().collection(COLLECTION);
}

// ── SELECT * FROM voteEvents ORDER BY voteTime ASC ──
export async function findAll() {
  return col().find({}).sort({ voteTime: 1 }).toArray();
}

// ── SELECT * FROM voteEvents WHERE id = ? ──
export async function findById(id) {
  return col().findOne({ id });
}

// ── SELECT * FROM voteEvents WHERE voteId = ? ──
export async function findByVoteId(voteId) {
  return col().find({ voteId }).sort({ voteTime: 1 }).toArray();
}

// ── SELECT * FROM voteEvents WHERE supporterId = ? ──
export async function findBySupporterId(supporterId) {
  return col().find({ supporterId }).sort({ voteTime: 1 }).toArray();
}

// ── SELECT * FROM voteEvents WHERE device = ? ──
export async function findByDevice(device) {
  return col().find({ device }).toArray();
}

// ── SELECT optionId, COUNT(*) AS votes FROM voteEvents
//    WHERE voteId = ? GROUP BY optionId ORDER BY votes DESC ──
export async function countVotesByOption(voteId) {
  return col()
    .aggregate([
      { $match: { voteId } },
      { $group: { _id: "$optionId", votes: { $sum: 1 } } },
      { $sort: { votes: -1 } },
    ])
    .toArray();
}

// ── SELECT device, COUNT(*) FROM voteEvents GROUP BY device ──
export async function countByDevice() {
  return col()
    .aggregate([
      { $group: { _id: "$device", total: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ])
    .toArray();
}

// ── INSERT INTO voteEvents VALUES (...) ──
export async function create(voteEventData) {
  const result = await col().insertOne(voteEventData);
  return { ...voteEventData, _id: result.insertedId };
}

// ── UPDATE voteEvents SET ... WHERE id = ? ──
export async function updateById(id, updateData) {
  const result = await col().findOneAndUpdate(
    { id },
    { $set: updateData },
    { returnDocument: "after" }
  );
  return result;
}

// ── DELETE FROM voteEvents WHERE id = ? ──
export async function deleteById(id) {
  const result = await col().deleteOne({ id });
  return result.deletedCount > 0;
}

// ── SELECT COUNT(*) FROM voteEvents ──
export async function count() {
  return col().countDocuments();
}
