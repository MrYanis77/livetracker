import { getDB } from "../config/db.mjs";

// ─────────────────────────────────────────────
//  MODEL : Teams
//  Équivalences SQL → MongoDB
// ─────────────────────────────────────────────

const COLLECTION = "teams";

/** @returns {import("mongodb").Collection} */
function col() {
  return getDB().collection(COLLECTION);
}

// ── SELECT * FROM teams ──
export async function findAll() {
  return col().find({}).toArray();
}

// ── SELECT * FROM teams WHERE id = ? ──
export async function findById(id) {
  return col().findOne({ id });
}

// ── SELECT * FROM teams WHERE group = ? ──
export async function findByGroup(group) {
  return col().find({ group }).toArray();
}

// ── SELECT * FROM teams WHERE continent = ? ──
export async function findByContinent(continent) {
  return col().find({ continent }).toArray();
}

// ── INSERT INTO teams VALUES (...) ──
export async function create(teamData) {
  const result = await col().insertOne(teamData);
  return { ...teamData, _id: result.insertedId };
}

// ── UPDATE teams SET ... WHERE id = ? ──
export async function updateById(id, updateData) {
  const result = await col().findOneAndUpdate(
    { id },
    { $set: updateData },
    { returnDocument: "after" }
  );
  return result;
}

// ── DELETE FROM teams WHERE id = ? ──
export async function deleteById(id) {
  const result = await col().deleteOne({ id });
  return result.deletedCount > 0;
}

// ── SELECT COUNT(*) FROM teams ──
export async function count() {
  return col().countDocuments();
}

// ── SELECT COUNT(*) FROM teams WHERE group = ? ──
export async function countByGroup(group) {
  return col().countDocuments({ group });
}

// ── SELECT DISTINCT group FROM teams ──
export async function distinctGroups() {
  return col().distinct("group");
}

// ── SELECT * FROM teams ORDER BY seed ASC ──
export async function findAllOrderBySeed() {
  return col().find({}).sort({ seed: 1 }).toArray();
}
