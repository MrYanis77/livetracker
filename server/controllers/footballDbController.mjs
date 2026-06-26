import * as FootballModel from "../models/footballModel.mjs";
import { syncFootballData } from "../services/footballDataSync.mjs";

function toFrontStatus(status) {
  if (status === "scheduled") return "upcoming";
  return status;
}

function matchToSummary(m) {
  return {
    id: m.id,
    source: "football-data",
    competitionCode: m.competitionCode,
    competition: m.competitionName ?? m.competitionCode,
    status: toFrontStatus(m.status),
    rawStatus: m.rawStatus,
    minute: m.minute,
    kickoff: m.kickoff,
    matchday: m.matchday,
    venue: m.venue,
    homeTeam: {
      name: m.homeTeamName ?? "Domicile",
      shortCode: m.homeTeamCode ?? "HOM",
      color: "#6366f1",
      crest: m.homeTeamCrest,
    },
    awayTeam: {
      name: m.awayTeamName ?? "Extérieur",
      shortCode: m.awayTeamCode ?? "AWY",
      color: "#f97316",
      crest: m.awayTeamCrest,
    },
    score: m.score ?? { home: 0, away: 0 },
  };
}

// GET /api/football/competitions
export async function getCompetitions(req, res) {
  try {
    const data = await FootballModel.findCompetitions();
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/football/matches
export async function getMatches(req, res) {
  try {
    const { competition, status, limit } = req.query;
    const data = await FootballModel.findMatches({
      competitionCode: competition,
      status,
      limit: limit ? Number(limit) : 50,
    });
    res.json({ success: true, count: data.length, data: data.map(matchToSummary) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/football/matches/live
export async function getLiveMatches(req, res) {
  try {
    const data = await FootballModel.findLiveMatches();
    res.json({ success: true, count: data.length, data: data.map(matchToSummary) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/football/matches/:id/detail
export async function getMatchDetail(req, res) {
  try {
    const match = await FootballModel.findMatchById(req.params.id);
    if (!match) return res.status(404).json({ success: false, error: "Match non trouvé" });

    const [homeTeam, awayTeam, events] = await Promise.all([
      match.homeTeamId ? FootballModel.findTeamById(match.homeTeamId) : null,
      match.awayTeamId ? FootballModel.findTeamById(match.awayTeamId) : null,
      FootballModel.findEventsByMatchId(match.id),
    ]);

    res.json({
      success: true,
      data: { match, homeTeam, awayTeam, events },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/football/standings/:code
export async function getStandings(req, res) {
  try {
    const data = await FootballModel.findStandings(req.params.code);
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/football/scorers/:code
export async function getScorers(req, res) {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const data = await FootballModel.findScorers(req.params.code, limit);
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/football/stats
export async function getStats(req, res) {
  try {
    const counts = await FootballModel.countAll();
    const lastSync = await FootballModel.getLastSyncLog();
    res.json({ success: true, data: { counts, lastSync } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function assertFootballMatchEditable(matchId) {
  const match = await FootballModel.findMatchById(matchId);
  if (!match) {
    const err = new Error("Match non trouvé");
    err.status = 404;
    throw err;
  }
  if (match.status === "finished") {
    const err = new Error("Impossible de modifier un match terminé");
    err.status = 403;
    throw err;
  }
  return match;
}

// POST /api/football/events
export async function createEvent(req, res) {
  try {
    await assertFootballMatchEditable(req.body.matchId);
    const event = await FootballModel.createEvent(req.body);
    res.status(201).json({ success: true, data: event });
  } catch (err) {
    const status = err.status ?? 500;
    res.status(status).json({ success: false, error: err.message });
  }
}

// DELETE /api/football/events/:id
export async function deleteEvent(req, res) {
  try {
    const event = await FootballModel.findEventById(req.params.id);
    if (!event) return res.status(404).json({ success: false, error: "Événement non trouvé" });
    await assertFootballMatchEditable(event.matchId);
    const deleted = await FootballModel.deleteEventById(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: "Événement non trouvé" });
    res.json({ success: true, message: "Événement supprimé" });
  } catch (err) {
    const status = err.status ?? 500;
    res.status(status).json({ success: false, error: err.message });
  }
}

// POST /api/football/sync
export async function triggerSync(req, res) {
  try {
    const stats = await syncFootballData({
      fetchMatchDetails: req.body?.fetchMatchDetails !== false,
      matchDetailLimit: req.body?.matchDetailLimit ?? 10,
      competitions: req.body?.competitions,
    });
    res.json({ success: true, data: stats });
  } catch (err) {
    if (err.code === "MISSING_API_KEY") {
      return res.status(503).json({
        success: false,
        error: err.message,
        hint: "Ajoutez FOOTBALL_DATA_API_KEY dans .env puis npm run sync:football",
      });
    }
    res.status(500).json({ success: false, error: err.message });
  }
}
