import { getDB } from "../config/db.mjs";

// ─────────────────────────────────────────────
//  MODEL : Stadiums
//  Équivalences SQL → MongoDB
// ─────────────────────────────────────────────

const COLLECTION = "stadiums";

/** @returns {import("mongodb").Collection} */
function col() {
  return getDB().collection(COLLECTION);
}

// ── SELECT * FROM stadiums ──
export async function findAll() {
  return col().find({}).toArray();
}

// ── SELECT * FROM stadiums WHERE id = ? ──
export async function findById(id) {
  return col().findOne({ id });
}

// ── SELECT * FROM stadiums WHERE country = ? ──
export async function findByCountry(country) {
  return col().find({ country }).toArray();
}

// ── SELECT * FROM stadiums WHERE capacity >= ? ORDER BY capacity DESC ──
export async function findByMinCapacity(minCapacity) {
  return col()
    .find({ capacity: { $gte: minCapacity } })
    .sort({ capacity: -1 })
    .toArray();
}

// ── INSERT INTO stadiums VALUES (...) ──
export async function create(stadiumData) {
  const result = await col().insertOne(stadiumData);
  return { ...stadiumData, _id: result.insertedId };
}

// ── UPDATE stadiums SET ... WHERE id = ? ──
export async function updateById(id, updateData) {
  const result = await col().findOneAndUpdate(
    { id },
    { $set: updateData },
    { returnDocument: "after" }
  );
  return result;
}

// ── DELETE FROM stadiums WHERE id = ? ──
export async function deleteById(id) {
  const result = await col().deleteOne({ id });
  return result.deletedCount > 0;
}

// ── SELECT COUNT(*) FROM stadiums ──
export async function count() {
  return col().countDocuments();
}

// ── SELECT SUM(capacity) AS totalCapacity FROM stadiums ──
export async function totalCapacity() {
  const result = await col()
    .aggregate([
      { $group: { _id: null, totalCapacity: { $sum: "$capacity" } } },
    ])
    .toArray();
  return result[0]?.totalCapacity || 0;
}
