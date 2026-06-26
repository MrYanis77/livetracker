import * as FootballData from "../services/footballDataService.mjs";

function handleError(res, err) {
  if (err.code === "MISSING_API_KEY") {
    return res.status(503).json({
      success: false,
      error: err.message,
      hint: "Ajoutez FOOTBALL_DATA_API_KEY dans .env (gratuit sur football-data.org)",
    });
  }
  const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 502;
  res.status(status).json({ success: false, error: err.message });
}

// GET /api/football-data/matches/today
export async function getToday(req, res) {
  try {
    const data = await FootballData.getTodayMatches();
    const matches = (data.matches ?? []).map(FootballData.normalizeExternalMatch);
    res.json({ success: true, count: matches.length, data: matches });
  } catch (err) {
    handleError(res, err);
  }
}

// GET /api/football-data/matches?competition=PL&status=LIVE
export async function getByCompetition(req, res) {
  try {
    const { competition = "PL", status, limit } = req.query;
    const data = await FootballData.getCompetitionMatchesLegacy(competition, { status, limit });
    const matches = (data.matches ?? []).map(FootballData.normalizeExternalMatch);
    res.json({ success: true, count: matches.length, data: matches, competition: data.competition ?? null });
  } catch (err) {
    handleError(res, err);
  }
}

// GET /api/football-data/matches/:id
export async function getById(req, res) {
  try {
    const raw = await FootballData.getMatchById(req.params.id);
    res.json({ success: true, data: FootballData.normalizeExternalMatch(raw), raw });
  } catch (err) {
    handleError(res, err);
  }
}
