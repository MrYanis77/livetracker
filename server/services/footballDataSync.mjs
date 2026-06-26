import {
  DEFAULT_COMPETITIONS,
  getCompetition,
  getCompetitionTeams,
  getCompetitionMatches,
  getCompetitionStandings,
  getCompetitionScorers,
  getMatchDetail,
  mapCompetition,
  mapTeam,
  mapMatch,
  mapStandings,
  mapScorers,
  extractMatchEvents,
  sleep,
} from "../services/footballDataService.mjs";
import * as FootballModel from "../models/footballModel.mjs";

const RATE_LIMIT_MS = 6500; // ~10 req/min free tier

/**
 * Synchronise toutes les données football-data.org vers MongoDB
 * @param {object} opts
 * @param {string[]} [opts.competitions]
 * @param {boolean} [opts.fetchMatchDetails] — récupère goals/cartons (plus lent)
 * @param {number} [opts.matchDetailLimit] — max détails match par compétition
 */
export async function syncFootballData({
  competitions = DEFAULT_COMPETITIONS,
  fetchMatchDetails = true,
  matchDetailLimit = 15,
} = {}) {
  const stats = {
    competitions: 0,
    teams: 0,
    matches: 0,
    standings: 0,
    scorers: 0,
    events: 0,
    errors: [],
  };

  for (const code of competitions) {
    try {
      console.log(`\n📥 Compétition ${code}…`);

      const compRaw = await getCompetition(code);
      await sleep(RATE_LIMIT_MS);
      const compDoc = mapCompetition(compRaw);
      await FootballModel.upsertMany("competitions", [compDoc]);
      stats.competitions++;

      const teamsRaw = await getCompetitionTeams(code);
      await sleep(RATE_LIMIT_MS);
      const teamDocs = (teamsRaw.teams ?? []).map((t) => mapTeam(t, code));
      stats.teams += await FootballModel.upsertMany("teams", teamDocs);
      for (const t of teamDocs) {
        await FootballModel.mergeTeamCompetition(t.id, code);
      }
      console.log(`   ✅ ${teamDocs.length} équipes`);

      const matchesRaw = await getCompetitionMatches(code, { limit: 100 });
      await sleep(RATE_LIMIT_MS);
      const matchDocs = (matchesRaw.matches ?? []).map(mapMatch);
      stats.matches += await FootballModel.upsertMany("matches", matchDocs);
      console.log(`   ✅ ${matchDocs.length} matchs`);

      try {
        const standingsRaw = await getCompetitionStandings(code);
        await sleep(RATE_LIMIT_MS);
        const standingDocs = mapStandings(code, standingsRaw.standings);
        stats.standings += await FootballModel.upsertMany("standings", standingDocs);
        console.log(`   ✅ ${standingDocs.length} classements`);
      } catch (err) {
        stats.errors.push(`${code}/standings: ${err.message}`);
        console.warn(`   ⚠️  Classement ${code}: ${err.message}`);
      }

      try {
        const scorersRaw = await getCompetitionScorers(code, { limit: 20 });
        await sleep(RATE_LIMIT_MS);
        const scorerDocs = mapScorers(code, scorersRaw.scorers);
        stats.scorers += await FootballModel.upsertMany("scorers", scorerDocs);
        console.log(`   ✅ ${scorerDocs.length} buteurs`);
      } catch (err) {
        stats.errors.push(`${code}/scorers: ${err.message}`);
        console.warn(`   ⚠️  Buteurs ${code}: ${err.message}`);
      }

      if (fetchMatchDetails && matchDocs.length) {
        const priority = matchDocs
          .filter((m) => ["live", "halftime", "finished"].includes(m.status))
          .sort((a, b) => new Date(b.kickoff) - new Date(a.kickoff))
          .slice(0, matchDetailLimit);

        console.log(`   🔍 Détail de ${priority.length} matchs…`);
        for (const m of priority) {
          try {
            const detail = await getMatchDetail(m.externalId);
            await sleep(RATE_LIMIT_MS);
            const events = extractMatchEvents(detail);
            if (events.length) {
              stats.events += await FootballModel.upsertMany("events", events);
            }
          } catch (err) {
            stats.errors.push(`${code}/match/${m.externalId}: ${err.message}`);
          }
        }
      }
    } catch (err) {
      stats.errors.push(`${code}: ${err.message}`);
      console.error(`   ❌ ${code}: ${err.message}`);
    }
  }

  await FootballModel.saveSyncLog({ type: "full", stats, competitions });
  return stats;
}
