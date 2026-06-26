const BASE_URL = "https://api.football-data.org/v4";

/** Compétitions tier free football-data.org */
export const DEFAULT_COMPETITIONS = ["PL", "PD", "BL1", "SA", "FL1", "CL", "DED", "PPL", "ELC"];

const STATUS_TO_DB = {
  SCHEDULED: "scheduled",
  TIMED: "scheduled",
  IN_PLAY: "live",
  PAUSED: "halftime",
  FINISHED: "finished",
  POSTPONED: "scheduled",
  SUSPENDED: "live",
  AWARDED: "finished",
  CANCELLED: "finished",
};

function getApiKey() {
  return process.env.FOOTBALL_DATA_API_KEY || "";
}

export async function fetchFootballData(path, params = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    const err = new Error("FOOTBALL_DATA_API_KEY manquant dans .env");
    err.code = "MISSING_API_KEY";
    throw err;
  }

  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }

  const res = await fetch(url, { headers: { "X-Auth-Token": apiKey } });
  if (!res.ok) {
    const body = await res.text();
    const err = new Error(`football-data.org ${res.status}: ${body.slice(0, 300)}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function teamId(externalId) {
  return `fd_team_${externalId}`;
}

export function matchId(externalId) {
  return `fd_match_${externalId}`;
}

export function competitionDocId(code) {
  return `fd_comp_${code}`;
}

export function mapStatus(raw) {
  return STATUS_TO_DB[raw] ?? "scheduled";
}

export function mapCompetition(raw) {
  return {
    id: competitionDocId(raw.code),
    externalId: raw.id,
    code: raw.code,
    name: raw.name,
    type: raw.type ?? null,
    emblem: raw.emblem ?? null,
    area: raw.area
      ? { name: raw.area.name, code: raw.area.code, flag: raw.area.flag ?? null }
      : null,
    currentSeason: raw.currentSeason
      ? {
          id: raw.currentSeason.id,
          startDate: raw.currentSeason.startDate,
          endDate: raw.currentSeason.endDate,
          currentMatchday: raw.currentSeason.currentMatchday ?? null,
        }
      : null,
    syncedAt: new Date().toISOString(),
  };
}

export function mapTeam(raw, competitionCode) {
  return {
    id: teamId(raw.id),
    externalId: raw.id,
    name: raw.name,
    shortName: raw.shortName ?? raw.name,
    code: raw.tla ?? raw.shortName?.slice(0, 3)?.toUpperCase() ?? "???",
    crest: raw.crest ?? null,
    venue: raw.venue ?? null,
    address: raw.address ?? null,
    website: raw.website ?? null,
    founded: raw.founded ?? null,
    clubColors: raw.clubColors ?? null,
    competitionCodes: competitionCode ? [competitionCode] : [],
    syncedAt: new Date().toISOString(),
  };
}

export function mapMatch(raw) {
  const homeExt = raw.homeTeam?.id;
  const awayExt = raw.awayTeam?.id;
  const homeScore = raw.score?.fullTime?.home ?? raw.score?.regularTime?.home ?? 0;
  const awayScore = raw.score?.fullTime?.away ?? raw.score?.regularTime?.away ?? 0;

  return {
    id: matchId(raw.id),
    externalId: raw.id,
    competitionCode: raw.competition?.code ?? null,
    competitionName: raw.competition?.name ?? null,
    matchday: raw.matchday ?? null,
    stage: raw.stage ?? null,
    group: raw.group ?? null,
    homeTeamId: homeExt ? teamId(homeExt) : null,
    awayTeamId: awayExt ? teamId(awayExt) : null,
    homeTeamExternalId: homeExt ?? null,
    awayTeamExternalId: awayExt ?? null,
    homeTeamName: raw.homeTeam?.name ?? null,
    awayTeamName: raw.awayTeam?.name ?? null,
    homeTeamCode: raw.homeTeam?.tla ?? null,
    awayTeamCode: raw.awayTeam?.tla ?? null,
    homeTeamCrest: raw.homeTeam?.crest ?? null,
    awayTeamCrest: raw.awayTeam?.crest ?? null,
    kickoff: raw.utcDate,
    status: mapStatus(raw.status),
    rawStatus: raw.status,
    minute: raw.minute ?? null,
    score: {
      home: homeScore ?? 0,
      away: awayScore ?? 0,
      halfTime: raw.score?.halfTime ?? null,
    },
    venue: raw.venue ?? null,
    referees: raw.referees ?? [],
    syncedAt: new Date().toISOString(),
  };
}

export function mapStandings(competitionCode, standingsRaw) {
  const docs = [];
  for (const standing of standingsRaw ?? []) {
    docs.push({
      id: `fd_standing_${competitionCode}_${standing.type ?? "TOTAL"}`,
      competitionCode,
      type: standing.type ?? "TOTAL",
      group: standing.group ?? null,
      table: (standing.table ?? []).map((row) => ({
        position: row.position,
        teamId: row.team?.id ? teamId(row.team.id) : null,
        teamExternalId: row.team?.id ?? null,
        teamName: row.team?.name ?? null,
        teamCrest: row.team?.crest ?? null,
        teamCode: row.team?.shortName?.slice(0, 3)?.toUpperCase() ?? null,
        playedGames: row.playedGames,
        won: row.won,
        draw: row.draw,
        lost: row.lost,
        points: row.points,
        goalsFor: row.goalsFor,
        goalsAgainst: row.goalsAgainst,
        goalDifference: row.goalDifference,
        form: row.form ?? null,
      })),
      syncedAt: new Date().toISOString(),
    });
  }
  return docs;
}

export function mapScorers(competitionCode, scorersRaw) {
  return (scorersRaw ?? []).map((s, i) => ({
    id: `fd_scorer_${competitionCode}_${s.player?.id ?? i}`,
    competitionCode,
    rank: i + 1,
    playerExternalId: s.player?.id ?? null,
    playerName: s.player?.name ?? "Inconnu",
    nationality: s.player?.nationality ?? null,
    teamId: s.team?.id ? teamId(s.team.id) : null,
    teamName: s.team?.name ?? null,
    goals: s.goals ?? 0,
    assists: s.assists ?? null,
    penalties: s.penalties ?? null,
    syncedAt: new Date().toISOString(),
  }));
}

/** Extrait les événements depuis le détail d'un match v4 */
export function extractMatchEvents(raw) {
  const events = [];
  const mid = matchId(raw.id);
  const homeExt = raw.homeTeam?.id;
  const awayExt = raw.awayTeam?.id;

  events.push({
    id: `${mid}_kickoff`,
    matchId: mid,
    minute: 1,
    eventType: "kickoff",
    teamId: null,
    playerName: null,
    description: "Coup d'envoi",
    eventTime: raw.utcDate,
  });

  for (const goal of raw.goals ?? []) {
    const isHome = goal.team?.id === homeExt || goal.scorer?.id; // team in goal might be missing
    const teamSide = goal.team?.id === homeExt ? teamId(homeExt) : goal.team?.id === awayExt ? teamId(awayExt) : null;
    events.push({
      id: `${mid}_goal_${goal.minute}_${goal.scorer?.id ?? events.length}`,
      matchId: mid,
      minute: goal.minute ?? 0,
      eventType: "goal",
      teamId: teamSide,
      playerName: goal.scorer?.name ?? null,
      description: goal.type === "PENALTY" ? "But sur penalty" : goal.type === "OWN" ? "But contre son camp" : "But",
      eventTime: raw.utcDate,
    });
  }

  for (const b of raw.bookings ?? []) {
    events.push({
      id: `${mid}_card_${b.minute}_${b.player?.id ?? events.length}`,
      matchId: mid,
      minute: b.minute ?? 0,
      eventType: b.card === "RED" ? "red_card" : "yellow_card",
      teamId: b.team?.id === homeExt ? teamId(homeExt) : b.team?.id === awayExt ? teamId(awayExt) : null,
      playerName: b.player?.name ?? null,
      description: b.card === "RED" ? "Carton rouge" : "Carton jaune",
      eventTime: raw.utcDate,
    });
  }

  for (const s of raw.substitutions ?? []) {
    events.push({
      id: `${mid}_sub_${s.minute}_${s.playerIn?.id ?? events.length}`,
      matchId: mid,
      minute: s.minute ?? 0,
      eventType: "substitution",
      teamId: s.team?.id === homeExt ? teamId(homeExt) : s.team?.id === awayExt ? teamId(awayExt) : null,
      playerName: s.playerIn?.name ?? null,
      playerOutName: s.playerOut?.name ?? null,
      description: "Remplacement",
      eventTime: raw.utcDate,
    });
  }

  if (raw.status === "FINISHED" || raw.status === "AWARDED") {
    const h = raw.score?.fullTime?.home ?? 0;
    const a = raw.score?.fullTime?.away ?? 0;
    events.push({
      id: `${mid}_fulltime`,
      matchId: mid,
      minute: 90,
      eventType: "full_time",
      teamId: null,
      playerName: null,
      description: `Fin du match · ${h}–${a}`,
      eventTime: raw.utcDate,
    });
  }

  return events.sort((a, b) => a.minute - b.minute);
}

export async function getCompetition(code) {
  return fetchFootballData(`/competitions/${code}`);
}

export async function getCompetitionTeams(code) {
  return fetchFootballData(`/competitions/${code}/teams`);
}

export async function getCompetitionMatches(code, { limit = 100 } = {}) {
  return fetchFootballData(`/competitions/${code}/matches`, { limit });
}

export async function getCompetitionStandings(code) {
  return fetchFootballData(`/competitions/${code}/standings`);
}

export async function getCompetitionScorers(code, { limit = 20 } = {}) {
  return fetchFootballData(`/competitions/${code}/scorers`, { limit });
}

export async function getMatchDetail(externalId) {
  return fetchFootballData(`/matches/${externalId}`);
}

export async function getAllCompetitions() {
  return fetchFootballData("/competitions");
}

export async function getTodayMatches() {
  const today = new Date().toISOString().slice(0, 10);
  return fetchFootballData("/matches", { dateFrom: today, dateTo: today });
}

/** Normalise un match football-data.org pour le front (legacy) */
export function normalizeExternalMatch(raw) {
  const mapped = mapMatch(raw);
  return {
    source: "football-data",
    id: mapped.id,
    competition: mapped.competitionName ?? "Compétition",
    status: mapped.status === "scheduled" ? "upcoming" : mapped.status === "halftime" ? "halftime" : mapped.status,
    rawStatus: mapped.rawStatus,
    minute: mapped.minute,
    kickoff: mapped.kickoff,
    homeTeam: {
      name: mapped.homeTeamName ?? "Domicile",
      shortCode: mapped.homeTeamCode ?? "HOM",
      color: "#6366f1",
      crest: mapped.homeTeamCrest,
    },
    awayTeam: {
      name: mapped.awayTeamName ?? "Extérieur",
      shortCode: mapped.awayTeamCode ?? "AWY",
      color: "#f97316",
      crest: mapped.awayTeamCrest,
    },
    score: mapped.score,
    venue: mapped.venue,
  };
}

export async function getCompetitionMatchesLegacy(competitionCode, { status, limit } = {}) {
  return fetchFootballData(`/competitions/${competitionCode}/matches`, { status, limit: limit ?? 20 });
}

export async function getMatchById(externalId) {
  return getMatchDetail(externalId);
}
