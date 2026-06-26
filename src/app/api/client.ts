import type {
  ApiResponse,
  DbMatchSummary,
  ExternalMatchSummary,
  MatchDetailPayload,
  DbMatchEvent,
  FootballCompetition,
  FootballStanding,
  FootballMatchDetailPayload,
  FootballDbEvent,
} from "../types/match";

const API_BASE = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.error ?? json.hint ?? `Erreur HTTP ${res.status}`);
  }
  return json as T;
}

export async function fetchMatches(status?: string) {
  const qs = status ? `?status=${status}` : "";
  const res = await request<ApiResponse<DbMatchSummary[]>>(`/matches${qs}`);
  return res.data;
}

export async function fetchLiveMatches() {
  const res = await request<ApiResponse<DbMatchSummary[]>>("/matches/live");
  return res.data;
}

export async function fetchMatchDetail(id: string) {
  const res = await request<ApiResponse<MatchDetailPayload>>(`/matches/${id}/detail`);
  return res.data;
}

export async function createMatchEvent(event: DbMatchEvent) {
  const res = await request<ApiResponse<DbMatchEvent>>("/match-events", {
    method: "POST",
    body: JSON.stringify(event),
  });
  return res.data;
}

export async function deleteMatchEvent(id: string) {
  await request<{ success: boolean }>(`/match-events/${id}`, { method: "DELETE" });
}

// ── Football (MongoDB, sync football-data.org) ──

export async function fetchFootballCompetitions() {
  const res = await request<ApiResponse<FootballCompetition[]>>("/football/competitions");
  return res.data;
}

export async function fetchFootballMatches(competition?: string, limit = 30) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (competition) params.set("competition", competition);
  const res = await request<ApiResponse<ExternalMatchSummary[]>>(`/football/matches?${params}`);
  return res.data;
}

export async function fetchFootballLiveMatches() {
  const res = await request<ApiResponse<ExternalMatchSummary[]>>("/football/matches/live");
  return res.data;
}

export async function fetchFootballMatchDetail(id: string) {
  const res = await request<ApiResponse<FootballMatchDetailPayload>>(`/football/matches/${id}/detail`);
  return res.data;
}

export async function createFootballMatchEvent(event: FootballDbEvent) {
  const res = await request<ApiResponse<FootballDbEvent>>("/football/events", {
    method: "POST",
    body: JSON.stringify(event),
  });
  return res.data;
}

export async function deleteFootballMatchEvent(id: string) {
  await request<{ success: boolean }>(`/football/events/${id}`, { method: "DELETE" });
}

export async function fetchFootballStandings(competitionCode: string) {
  const res = await request<ApiResponse<FootballStanding[]>>(`/football/standings/${competitionCode}`);
  return res.data;
}

export async function fetchFootballStats() {
  const res = await request<ApiResponse<{ counts: Record<string, number>; lastSync: unknown }>>("/football/stats");
  return res.data;
}

export async function triggerFootballSync() {
  const res = await request<ApiResponse<Record<string, number>>>("/football/sync", {
    method: "POST",
    body: JSON.stringify({ fetchMatchDetails: true, matchDetailLimit: 5 }),
  });
  return res.data;
}

export async function fetchTeams() {
  const res = await request<ApiResponse<{ id: string; name: string; code: string; group: string }[]>>(
    "/teams"
  );
  return res.data;
}

export async function fetchStadiums() {
  const res = await request<ApiResponse<{ id: string; name: string; city: string }[]>>("/stadiums");
  return res.data;
}

export interface CreateMatchPayload {
  id: string;
  phase: string;
  group: string;
  homeTeamId: string;
  awayTeamId: string;
  stadiumId?: string;
  kickoff: string;
  status: string;
  score: { home: number; away: number };
}

export async function createMatch(data: CreateMatchPayload) {
  const res = await request<ApiResponse<DbMatchSummary>>("/matches", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}
