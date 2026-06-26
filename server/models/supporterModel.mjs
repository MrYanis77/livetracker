import { getDB } from "../config/db.mjs";

// ─────────────────────────────────────────────
//  MODEL : Supporters
//  Équivalences SQL → MongoDB
// ─────────────────────────────────────────────

const COLLECTION = "supporters";

/** @returns {import("mongodb").Collection} */
function col() {
  return getDB().collection(COLLECTION);
}

// ── SELECT * FROM supporters ──
export async function findAll() {
  return col().find({}).toArray();
}

// ── SELECT * FROM supporters WHERE id = ? ──
export async function findById(id) {
  return col().findOne({ id });
}

// ── SELECT * FROM supporters WHERE username = ? ──
export async function findByUsername(username) {
  return col().findOne({ username });
}

// ── SELECT * FROM supporters WHERE country = ? ──
export async function findByCountry(country) {
  return col().find({ country }).toArray();
}

// ── SELECT * FROM supporters
//    INNER JOIN supporter_teams ON ...
//    WHERE favoriteTeamIds CONTAINS ? ──
export async function findByFavoriteTeam(teamId) {
  return col().find({ favoriteTeamIds: teamId }).toArray();
}

// ── SELECT * FROM supporters WHERE followedMatchIds CONTAINS ? ──
export async function findByFollowedMatch(matchId) {
  return col().find({ followedMatchIds: matchId }).toArray();
}

// ── SELECT * FROM supporters WHERE interests CONTAINS ? ──
export async function findByInterest(interest) {
  return col().find({ interests: interest }).toArray();
}

// ── INSERT INTO supporters VALUES (...) ──
export async function create(supporterData) {
  const result = await col().insertOne(supporterData);
  return { ...supporterData, _id: result.insertedId };
}

// ── UPDATE supporters SET ... WHERE id = ? ──
export async function updateById(id, updateData) {
  const result = await col().findOneAndUpdate(
    { id },
    { $set: updateData },
    { returnDocument: "after" }
  );
  return result;
}

// ── UPDATE supporters SET favoriteTeamIds = CONCAT(favoriteTeamIds, ?) WHERE id = ? ──
export async function addFavoriteTeam(supporterId, teamId) {
  const result = await col().findOneAndUpdate(
    { id: supporterId },
    { $addToSet: { favoriteTeamIds: teamId } },
    { returnDocument: "after" }
  );
  return result;
}

// ── UPDATE supporters SET followedMatchIds = CONCAT(..., ?) WHERE id = ? ──
export async function followMatch(supporterId, matchId) {
  const result = await col().findOneAndUpdate(
    { id: supporterId },
    { $addToSet: { followedMatchIds: matchId } },
    { returnDocument: "after" }
  );
  return result;
}

// ── DELETE FROM supporters WHERE id = ? ──
export async function deleteById(id) {
  const result = await col().deleteOne({ id });
  return result.deletedCount > 0;
}

// ── SELECT COUNT(*) FROM supporters ──
export async function count() {
  return col().countDocuments();
}

// ── SELECT country, COUNT(*) FROM supporters GROUP BY country ──
export async function countByCountry() {
  return col()
    .aggregate([
      { $group: { _id: "$country", total: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ])
    .toArray();
}
