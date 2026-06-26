import { getDB } from "../config/db.mjs";

// ─────────────────────────────────────────────
//  MODEL : FanVotes
//  Équivalences SQL → MongoDB
// ─────────────────────────────────────────────

const COLLECTION = "fanVotes";

/** @returns {import("mongodb").Collection} */
function col() {
  return getDB().collection(COLLECTION);
}

// ── SELECT * FROM fanVotes ──
export async function findAll() {
  return col().find({}).toArray();
}

// ── SELECT * FROM fanVotes WHERE id = ? ──
export async function findById(id) {
  return col().findOne({ id });
}

// ── SELECT * FROM fanVotes WHERE matchId = ? ──
export async function findByMatchId(matchId) {
  return col().find({ matchId }).toArray();
}

// ── SELECT * FROM fanVotes WHERE status = ? ──
export async function findByStatus(status) {
  return col().find({ status }).toArray();
}

// ── SELECT * FROM fanVotes WHERE voteType = ? ──
export async function findByType(voteType) {
  return col().find({ voteType }).toArray();
}

// ── INSERT INTO fanVotes VALUES (...) ──
export async function create(voteData) {
  const result = await col().insertOne(voteData);
  return { ...voteData, _id: result.insertedId };
}

// ── UPDATE fanVotes SET ... WHERE id = ? ──
export async function updateById(id, updateData) {
  const result = await col().findOneAndUpdate(
    { id },
    { $set: updateData },
    { returnDocument: "after" }
  );
  return result;
}

// ── UPDATE fanVotes SET status = 'closed' WHERE id = ? ──
export async function closeVote(id) {
  const result = await col().findOneAndUpdate(
    { id },
    { $set: { status: "closed" } },
    { returnDocument: "after" }
  );
  return result;
}

// ── DELETE FROM fanVotes WHERE id = ? ──
export async function deleteById(id) {
  const result = await col().deleteOne({ id });
  return result.deletedCount > 0;
}

// ── SELECT COUNT(*) FROM fanVotes ──
export async function count() {
  return col().countDocuments();
}
