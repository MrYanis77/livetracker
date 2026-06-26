import { getDB } from "../config/db.mjs";

const COLLECTIONS = {
  competitions: "footballCompetitions",
  teams: "footballTeams",
  matches: "footballMatches",
  standings: "footballStandings",
  scorers: "footballScorers",
  events: "footballMatchEvents",
  syncLog: "footballSyncLog",
};

function col(name) {
  return getDB().collection(COLLECTIONS[name]);
}

export async function upsertMany(collection, docs, keyField = "id") {
  if (!docs.length) return 0;
  const ops = docs.map((doc) => ({
    updateOne: {
      filter: { [keyField]: doc[keyField] },
      update: {
        $set: doc,
        $setOnInsert: { createdAt: new Date().toISOString() },
      },
      upsert: true,
    },
  }));
  const result = await col(collection).bulkWrite(ops, { ordered: false });
  return result.upsertedCount + result.modifiedCount;
}

export async function mergeTeamCompetition(teamId, competitionCode) {
  await col("teams").updateOne(
    { id: teamId },
    { $addToSet: { competitionCodes: competitionCode } }
  );
}

export async function findCompetitions() {
  return col("competitions").find({}).sort({ name: 1 }).toArray();
}

export async function findTeams({ competitionCode } = {}) {
  const filter = competitionCode ? { competitionCodes: competitionCode } : {};
  return col("teams").find(filter).sort({ name: 1 }).toArray();
}

export async function findTeamById(id) {
  return col("teams").findOne({ id });
}

export async function findMatches({ competitionCode, status, limit = 50 } = {}) {
  const filter = {};
  if (competitionCode) filter.competitionCode = competitionCode;
  if (status) filter.status = status;
  return col("matches").find(filter).sort({ kickoff: -1 }).limit(limit).toArray();
}

export async function findLiveMatches() {
  return col("matches").find({ status: { $in: ["live", "halftime"] } }).sort({ kickoff: -1 }).toArray();
}

export async function findMatchById(id) {
  return col("matches").findOne({ id });
}

export async function findEventsByMatchId(matchId) {
  return col("events").find({ matchId }).sort({ minute: 1 }).toArray();
}

export async function findEventById(id) {
  return col("events").findOne({ id });
}

export async function createEvent(eventData) {
  await col("events").insertOne(eventData);
  await syncMatchScoreFromEvents(eventData.matchId);
  return eventData;
}

export async function deleteEventById(id) {
  const event = await findEventById(id);
  if (!event) return false;
  const result = await col("events").deleteOne({ id });
  if (result.deletedCount > 0) {
    await syncMatchScoreFromEvents(event.matchId);
  }
  return result.deletedCount > 0;
}

async function syncMatchScoreFromEvents(matchId) {
  const match = await findMatchById(matchId);
  if (!match) return;
  const events = await findEventsByMatchId(matchId);
  let home = 0;
  let away = 0;
  for (const e of events) {
    if (e.eventType === "goal") {
      if (e.teamId === match.homeTeamId) home++;
      else if (e.teamId === match.awayTeamId) away++;
    }
  }
  await col("matches").updateOne(
    { id: matchId },
    { $set: { score: { home, away }, syncedAt: new Date().toISOString() } }
  );
}

export async function findStandings(competitionCode) {
  return col("standings").find({ competitionCode }).toArray();
}

export async function findScorers(competitionCode, limit = 20) {
  return col("scorers").find({ competitionCode }).sort({ rank: 1 }).limit(limit).toArray();
}

export async function saveSyncLog(entry) {
  await col("syncLog").insertOne({ ...entry, at: new Date().toISOString() });
}

export async function getLastSyncLog() {
  return col("syncLog").find({}).sort({ at: -1 }).limit(1).next();
}

export async function countAll() {
  const [competitions, teams, matches, events, standings, scorers] = await Promise.all([
    col("competitions").countDocuments(),
    col("teams").countDocuments(),
    col("matches").countDocuments(),
    col("events").countDocuments(),
    col("standings").countDocuments(),
    col("scorers").countDocuments(),
  ]);
  return { competitions, teams, matches, events, standings, scorers };
}

export { COLLECTIONS };
