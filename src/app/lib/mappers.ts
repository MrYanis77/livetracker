import type {
  DbMatchEvent,
  MatchDetailPayload,
  MatchEvent,
  MatchState,
  MatchStatus,
  Team,
  TeamSide,
  EventType,
  ExternalMatchSummary,
  FootballMatchDetailPayload,
  FootballDbEvent,
} from "../types/match";

const COLOR_MAP: Record<string, string> = {
  bleu: "#003189",
  "bleu ciel": "#75aadb",
  blanc: "#f5f5f5",
  rouge: "#ef4135",
  jaune: "#f4c430",
  vert: "#009c3b",
  noir: "#111111",
  or: "#c9a227",
  bordeaux: "#7b1e3a",
  orange: "#f97316",
};

const EVENT_TYPE_MAP: Record<string, EventType> = {
  goal: "goal",
  yellow_card: "yellow_card",
  red_card: "red_card",
  substitution: "substitution",
  kickoff: "kickoff",
  half_time: "halftime",
  halftime: "halftime",
  full_time: "fulltime",
  fulltime: "fulltime",
  var: "var",
};

const STATUS_MAP: Record<string, MatchStatus> = {
  live: "live",
  finished: "finished",
  scheduled: "upcoming",
  upcoming: "upcoming",
  halftime: "halftime",
};

function teamColor(colors?: string[]): string {
  if (!colors?.length) return "#6366f1";
  const first = colors[0].toLowerCase();
  return COLOR_MAP[first] ?? "#6366f1";
}

function mapTeam(team: { name: string; code: string; colors?: string[] }): Team {
  return {
    name: team.name,
    shortCode: team.code,
    color: teamColor(team.colors),
  };
}

function mapEventType(dbType: string): EventType {
  return EVENT_TYPE_MAP[dbType] ?? "var";
}

function teamSide(teamId: string | null, homeId: string, awayId: string): TeamSide | undefined {
  if (teamId === homeId) return "home";
  if (teamId === awayId) return "away";
  return undefined;
}

export function mapDbEvent(
  evt: DbMatchEvent,
  homeTeamId: string,
  awayTeamId: string,
  players: Record<string, { name: string }>
): MatchEvent {
  const type = mapEventType(evt.eventType);
  const side = teamSide(evt.teamId, homeTeamId, awayTeamId);
  return {
    id: evt.id,
    minute: evt.minute,
    type,
    team: side,
    playerName: evt.playerId ? players[evt.playerId]?.name : undefined,
    note: evt.description,
  };
}

export function mapDbDetailToMatchState(detail: MatchDetailPayload): MatchState {
  const { match, homeTeam, awayTeam, events, players, stadium } = detail;
  const mappedEvents = events.map((e) =>
    mapDbEvent(e, homeTeam.id, awayTeam.id, players)
  );
  const lastMinute = mappedEvents.reduce((max, e) => Math.max(max, e.minute), 0);
  const phaseLabel =
    match.phase === "group_stage"
      ? `Groupe ${match.group}`
      : match.phase.replace(/_/g, " ");

  return {
    source: "database",
    id: match.id,
    competition: `Coupe du Monde 2026 · ${phaseLabel}${stadium ? ` · ${stadium.name}` : ""}`,
    homeTeam: mapTeam(homeTeam),
    awayTeam: mapTeam(awayTeam),
    status: STATUS_MAP[match.status] ?? "upcoming",
    currentMinute: match.status === "live" ? Math.max(lastMinute, 1) : lastMinute,
    events: mappedEvents,
    score: match.score,
  };
}

export function mapFootballDbEvent(
  evt: FootballDbEvent,
  homeTeamId: string,
  awayTeamId: string
): MatchEvent {
  const type = mapEventType(evt.eventType);
  const side = teamSide(evt.teamId, homeTeamId, awayTeamId);
  return {
    id: evt.id,
    minute: evt.minute,
    type,
    team: side,
    playerName: evt.playerName ?? undefined,
    playerOutName: evt.playerOutName ?? undefined,
    note: evt.description,
  };
}

export function mapFootballDetailToMatchState(detail: FootballMatchDetailPayload): MatchState {
  const { match, homeTeam, awayTeam, events } = detail;
  const homeId = match.homeTeamId;
  const awayId = match.awayTeamId;
  const mappedEvents = events.map((e) => mapFootballDbEvent(e, homeId, awayId));
  const lastMinute = mappedEvents.reduce((max, e) => Math.max(max, e.minute), match.minute ?? 0);

  const home: Team = homeTeam
    ? { name: homeTeam.name, shortCode: homeTeam.code, color: "#6366f1", crest: homeTeam.crest }
    : { name: "Domicile", shortCode: "HOM", color: "#6366f1" };
  const away: Team = awayTeam
    ? { name: awayTeam.name, shortCode: awayTeam.code, color: "#f97316", crest: awayTeam.crest }
    : { name: "Extérieur", shortCode: "AWY", color: "#f97316" };

  return {
    source: "football-data",
    id: match.id,
    competition: `${match.competitionName}${match.venue ? ` · ${match.venue}` : ""}`,
    homeTeam: home,
    awayTeam: away,
    status: STATUS_MAP[match.status] ?? "upcoming",
    currentMinute: match.status === "live" ? Math.max(lastMinute, match.minute ?? 1) : lastMinute,
    events: mappedEvents,
    score: match.score,
  };
}

export function mapExternalToMatchState(ext: ExternalMatchSummary): MatchState {
  const events: MatchEvent[] = [];
  if (ext.status === "live" || ext.status === "finished") {
    events.push({
      id: "ext-kickoff",
      minute: 1,
      type: "kickoff",
      note: `Coup d'envoi · ${ext.competition}`,
    });
  }
  if (ext.status === "finished") {
    events.push({
      id: "ext-ft",
      minute: 90,
      type: "fulltime",
      note: `Fin du match · ${ext.score.home}–${ext.score.away}`,
    });
  }

  return {
    source: "football-data",
    id: ext.id,
    competition: `${ext.competition}${ext.venue ? ` · ${ext.venue}` : ""}`,
    homeTeam: ext.homeTeam,
    awayTeam: ext.awayTeam,
    status: ext.status,
    currentMinute: ext.minute ?? (ext.status === "finished" ? 90 : 0),
    events,
    score: ext.score,
  };
}

export function footballEventFromForm(
  matchId: string,
  form: {
    minute: number;
    type: EventType;
    team?: TeamSide;
    playerName?: string;
    playerOutName?: string;
    note?: string;
  },
  homeTeamId: string,
  awayTeamId: string
): FootballDbEvent {
  const dbType =
    form.type === "halftime"
      ? "half_time"
      : form.type === "fulltime"
        ? "full_time"
        : form.type;

  return {
    id: `fd_evt_${Date.now()}`,
    matchId,
    minute: form.minute,
    eventType: dbType,
    teamId: form.team === "home" ? homeTeamId : form.team === "away" ? awayTeamId : null,
    playerName: form.playerName || null,
    playerOutName: form.type === "substitution" ? form.playerOutName || null : null,
    description: form.note || undefined,
  };
}

export function dbEventFromForm(
  matchId: string,
  form: {
    minute: number;
    minuteExtra?: number;
    type: EventType;
    team?: TeamSide;
    playerName?: string;
    note?: string;
  },
  homeTeamId: string,
  awayTeamId: string
) {
  const dbType =
    form.type === "halftime"
      ? "half_time"
      : form.type === "fulltime"
        ? "full_time"
        : form.type;

  return {
    id: `evt_${Date.now()}`,
    matchId,
    minute: form.minute,
    eventType: dbType,
    teamId: form.team === "home" ? homeTeamId : form.team === "away" ? awayTeamId : null,
    playerId: null,
    description: [form.playerName, form.note].filter(Boolean).join(" · ") || undefined,
    eventTime: new Date().toISOString(),
  };
}
