import { getDB } from "../config/db.mjs";

// ─────────────────────────────────────────────
//  MODEL : Players
//  Équivalences SQL → MongoDB
// ─────────────────────────────────────────────

const COLLECTION = "players";

/** @returns {import("mongodb").Collection} */
function col() {
  return getDB().collection(COLLECTION);
}

// ── SELECT * FROM players ──
export async function findAll() {
  return col().find({}).toArray();
}

// ── SELECT * FROM players WHERE id = ? ──
export async function findById(id) {
  return col().findOne({ id });
}

// ── SELECT * FROM players WHERE teamId = ? ──
export async function findByTeamId(teamId) {
  return col().find({ teamId }).toArray();
}

// ── SELECT * FROM players WHERE position = ? ──
export async function findByPosition(position) {
  return col().find({ position }).toArray();
}

// ── SELECT * FROM players WHERE tags LIKE '%titulaire%'
//    (SQL IN → Mongo $in sur un tableau) ──
export async function findTitulaires() {
  return col().find({ tags: "titulaire" }).toArray();
}

// ── SELECT * FROM players WHERE tags LIKE '%rotation%' ──
export async function findRemplacants() {
  return col().find({ tags: "rotation" }).toArray();
}

// ── SELECT * FROM players WHERE age BETWEEN ? AND ? ──
export async function findByAgeRange(minAge, maxAge) {
  return col().find({ age: { $gte: minAge, $lte: maxAge } }).toArray();
}

// ── SELECT * FROM players WHERE stats.attack > ? ORDER BY stats.attack DESC ──
export async function findTopAttackers(minAttack = 70) {
  return col()
    .find({ "stats.attack": { $gte: minAttack } })
    .sort({ "stats.attack": -1 })
    .toArray();
}

// ── SELECT * FROM players WHERE stats.speed > ? ORDER BY stats.speed DESC ──
export async function findFastest(minSpeed = 80) {
  return col()
    .find({ "stats.speed": { $gte: minSpeed } })
    .sort({ "stats.speed": -1 })
    .toArray();
}

// ── SELECT teamId, COUNT(*) AS total FROM players GROUP BY teamId ──
export async function countByTeam() {
  return col()
    .aggregate([
      { $group: { _id: "$teamId", total: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ])
    .toArray();
}

// ── SELECT teamId, AVG(age) AS avgAge FROM players GROUP BY teamId ──
export async function avgAgeByTeam() {
  return col()
    .aggregate([
      { $group: { _id: "$teamId", avgAge: { $avg: "$age" } } },
      { $sort: { avgAge: 1 } },
    ])
    .toArray();
}

// ── SELECT position, AVG(stats.attack) ... GROUP BY position ──
export async function avgStatsByPosition() {
  return col()
    .aggregate([
      {
        $group: {
          _id: "$position",
          avgAttack: { $avg: "$stats.attack" },
          avgDefense: { $avg: "$stats.defense" },
          avgSpeed: { $avg: "$stats.speed" },
          avgTechnique: { $avg: "$stats.technique" },
          avgStamina: { $avg: "$stats.stamina" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])
    .toArray();
}

// ── INSERT INTO players VALUES (...) ──
export async function create(playerData) {
  const result = await col().insertOne(playerData);
  return { ...playerData, _id: result.insertedId };
}

// ── UPDATE players SET ... WHERE id = ? ──
export async function updateById(id, updateData) {
  const result = await col().findOneAndUpdate(
    { id },
    { $set: updateData },
    { returnDocument: "after" }
  );
  return result;
}

// ── DELETE FROM players WHERE id = ? ──
export async function deleteById(id) {
  const result = await col().deleteOne({ id });
  return result.deletedCount > 0;
}

// ── SELECT COUNT(*) FROM players ──
export async function count() {
  return col().countDocuments();
}

// ── SELECT * FROM players WHERE name LIKE '%search%' (ILIKE) ──
export async function searchByName(search) {
  return col()
    .find({ name: { $regex: search, $options: "i" } })
    .toArray();
}
