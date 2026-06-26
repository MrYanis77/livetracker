export type TeamSide = "home" | "away";
export type MatchStatus = "upcoming" | "live" | "halftime" | "finished";
export type EventType =
  | "goal"
  | "yellow_card"
  | "red_card"
  | "substitution"
  | "kickoff"
  | "halftime"
  | "fulltime"
  | "var";
export type FilterType = EventType | "all";
export type MatchSource = "database" | "football-data";

export interface MatchEvent {
  id: string;
  minute: number;
  minuteExtra?: number;
  type: EventType;
  team?: TeamSide;
  playerName?: string;
  playerOutName?: string;
  note?: string;
}

export interface Team {
  name: string;
  shortCode: string;
  color: string;
  crest?: string | null;
}

export interface MatchState {
  source: MatchSource;
  id: string;
  competition: string;
  homeTeam: Team;
  awayTeam: Team;
  status: MatchStatus;
  currentMinute: number;
  events: MatchEvent[];
  score?: { home: number; away: number };
}

export interface DbMatchSummary {
  id: string;
  phase: string;
  group: string;
  homeTeamId: string;
  awayTeamId: string;
  status: string;
  score: { home: number; away: number };
  kickoff: string;
}

export interface ExternalMatchSummary {
  source: "football-data";
  id: string;
  competitionCode?: string;
  competition: string;
  status: MatchStatus;
  rawStatus: string;
  minute: number | null;
  kickoff: string;
  matchday?: number | null;
  homeTeam: Team;
  awayTeam: Team;
  score: { home: number; away: number };
  venue: string | null;
}

export interface FootballMatchDetailPayload {
  match: {
    id: string;
    competitionCode: string;
    competitionName: string;
    status: string;
    minute: number | null;
    score: { home: number; away: number };
    venue: string | null;
    homeTeamId: string;
    awayTeamId: string;
  };
  homeTeam: { id: string; name: string; code: string; crest?: string | null } | null;
  awayTeam: { id: string; name: string; code: string; crest?: string | null } | null;
  events: FootballDbEvent[];
}

export interface FootballDbEvent {
  id: string;
  matchId: string;
  minute: number;
  eventType: string;
  teamId: string | null;
  playerName?: string | null;
  playerOutName?: string | null;
  description?: string;
}

export interface FootballStanding {
  id: string;
  competitionCode: string;
  type: string;
  table: {
    position: number;
    teamName: string;
    teamCode: string | null;
    teamCrest?: string | null;
    playedGames: number;
    won: number;
    draw: number;
    lost: number;
    points: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    form: string | null;
  }[];
}

export interface FootballCompetition {
  id: string;
  code: string;
  name: string;
  emblem: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  error?: string;
}

export interface MatchDetailPayload {
  match: DbMatchSummary & { stadiumId?: string };
  homeTeam: { id: string; name: string; code: string; colors?: string[] };
  awayTeam: { id: string; name: string; code: string; colors?: string[] };
  stadium?: { name: string; city: string } | null;
  events: DbMatchEvent[];
  players: Record<string, { id: string; name: string }>;
}

export interface DbMatchEvent {
  id: string;
  matchId: string;
  minute: number;
  eventType: string;
  teamId: string | null;
  playerId: string | null;
  description?: string;
}
