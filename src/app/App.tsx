import { useState, useEffect, useCallback, useMemo } from "react";
import clsx from "clsx";
import {
  fetchMatches,
  fetchMatchDetail,
  fetchFootballMatches,
  fetchFootballMatchDetail,
  fetchFootballStandings,
  fetchFootballStats,
  fetchTeams,
  fetchStadiums,
  createMatch,
  createMatchEvent,
  createFootballMatchEvent,
  deleteMatchEvent,
  deleteFootballMatchEvent,
} from "./api/client";
import { mapDbDetailToMatchState, mapFootballDetailToMatchState, dbEventFromForm, footballEventFromForm } from "./lib/mappers";
import { MatchExplorer, type SourceTab, type StatusFilter } from "./components/MatchExplorer";
import { ScoreboardHero } from "./components/ScoreboardHero";
import { EventTimeline } from "./components/EventTimeline";
import { StandingsPanel } from "./components/StandingsPanel";
import { EventFormModal } from "./components/EventFormModal";
import { ThemeToggle } from "./components/ThemeToggle";
import {
  CreateMatchModal,
  BLANK_CREATE_MATCH,
  defaultKickoffLocal,
  nextMatchId,
  kickoffToIso,
  type CreateMatchForm,
} from "./components/CreateMatchModal";
import type {
  MatchState,
  EventType,
  FilterType,
  TeamSide,
  DbMatchSummary,
  ExternalMatchSummary,
  MatchDetailPayload,
  FootballMatchDetailPayload,
  FootballStanding,
} from "./types/match";
import type { WorldCupDisplayMatch } from "./components/MatchExplorer";

const BLANK_FORM = {
  minute: 90,
  minuteExtra: "",
  type: "goal" as EventType,
  team: "home" as TeamSide,
  playerName: "",
  playerOutName: "",
  note: "",
};

type MobileView = "matches" | "detail" | "standings";

function computeScore(events: { type: string; team?: string }[]) {
  return events.reduce(
    (acc, e) => {
      if (e.type === "goal") {
        if (e.team === "home") acc.home++;
        else if (e.team === "away") acc.away++;
      }
      return acc;
    },
    { home: 0, away: 0 }
  );
}

export default function App() {
  const [match, setMatch] = useState<MatchState | null>(null);
  const [dbDetail, setDbDetail] = useState<MatchDetailPayload | null>(null);
  const [footballDetail, setFootballDetail] = useState<FootballMatchDetailPayload | null>(null);
  const [dbMatches, setDbMatches] = useState<DbMatchSummary[]>([]);
  const [teams, setTeams] = useState<Record<string, { code: string; name: string }>>({});
  const [teamList, setTeamList] = useState<{ id: string; name: string; code: string; group: string }[]>([]);
  const [stadiums, setStadiums] = useState<{ id: string; name: string; city: string }[]>([]);
  const [footballMatches, setFootballMatches] = useState<ExternalMatchSummary[]>([]);
  const [footballCompetition, setFootballCompetition] = useState("PL");
  const [standings, setStandings] = useState<FootballStanding[]>([]);
  const [footballStats, setFootballStats] = useState<{ counts: Record<string, number> } | null>(null);

  const [sourceTab, setSourceTab] = useState<SourceTab>("worldcup");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [mobileView, setMobileView] = useState<MobileView>("detail");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [liveMinute, setLiveMinute] = useState(0);
  const [filter, setFilter] = useState<FilterType>("all");
  const [showForm, setShowForm] = useState(false);
  const [showCreateMatch, setShowCreateMatch] = useState(false);
  const [createForm, setCreateForm] = useState<CreateMatchForm>({ ...BLANK_CREATE_MATCH });
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ ...BLANK_FORM });
  const [loading, setLoading] = useState(true);
  const [footballLoading, setFootballLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [footballError, setFootballError] = useState<string | null>(null);

  const worldcupDisplay: WorldCupDisplayMatch[] = useMemo(
    () =>
      dbMatches.map((m) => ({
        ...m,
        homeCode: teams[m.homeTeamId]?.code ?? "???",
        awayCode: teams[m.awayTeamId]?.code ?? "???",
        homeName: teams[m.homeTeamId]?.name,
        awayName: teams[m.awayTeamId]?.name,
      })),
    [dbMatches, teams]
  );

  const loadDbMatch = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const detail = await fetchMatchDetail(id);
      const state = mapDbDetailToMatchState(detail);
      setDbDetail(detail);
      setFootballDetail(null);
      setMatch(state);
      setLiveMinute(state.currentMinute);
      setSourceTab("worldcup");
      setMobileView("detail");
      setSidebarOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFootballMatch = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    setDbDetail(null);
    try {
      const detail = await fetchFootballMatchDetail(id);
      setFootballDetail(detail);
      const state = mapFootballDetailToMatchState(detail);
      setMatch(state);
      setLiveMinute(state.currentMinute);
      setSourceTab("football");
      setMobileView("detail");
      setSidebarOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const [matches, teamListData, stadiumList] = await Promise.all([
          fetchMatches(),
          fetchTeams(),
          fetchStadiums().catch(() => []),
        ]);
        setDbMatches(matches);
        setTeamList(teamListData);
        setStadiums(stadiumList);
        const map: Record<string, { code: string; name: string }> = {};
        for (const t of teamListData) map[t.id] = { code: t.code, name: t.name };
        setTeams(map);
        const live = matches.find((m) => m.status === "live");
        const pick = live ?? matches[0];
        if (pick) await loadDbMatch(pick.id);
        else setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de joindre l'API");
        setLoading(false);
      }
    }
    init();
  }, [loadDbMatch]);

  useEffect(() => {
    async function loadFootball() {
      setFootballLoading(true);
      setFootballError(null);
      try {
        const [matches, stats, standingData] = await Promise.all([
          fetchFootballMatches(footballCompetition, 40),
          fetchFootballStats().catch(() => null),
          fetchFootballStandings(footballCompetition).catch(() => []),
        ]);
        setFootballMatches(matches);
        setFootballStats(stats);
        setStandings(standingData);
        if (!matches.length && stats?.counts?.matches === 0) {
          setFootballError("Aucune donnée — lancez npm run sync:football");
        }
      } catch (err) {
        setFootballError(err instanceof Error ? err.message : "Données football indisponibles");
        setFootballMatches([]);
        setStandings([]);
      } finally {
        setFootballLoading(false);
      }
    }
    loadFootball();
  }, [footballCompetition]);

  useEffect(() => {
    if (!match || match.status !== "live" || match.source !== "database") return;
    const t = setInterval(() => setLiveMinute((m) => Math.min(m + 1, 120)), 45_000);
    return () => clearInterval(t);
  }, [match?.status, match?.source]);

  useEffect(() => {
    if (!match || match.source !== "database" || match.status !== "live") return;
    const t = setInterval(() => loadDbMatch(match.id), 30_000);
    return () => clearInterval(t);
  }, [match?.id, match?.source, match?.status, loadDbMatch]);

  useEffect(() => {
    if (!match || match.source !== "football-data" || match.status !== "live") return;
    const t = setInterval(() => loadFootballMatch(match.id), 60_000);
    return () => clearInterval(t);
  }, [match?.id, match?.source, match?.status, loadFootballMatch]);

  const score = match?.score ?? (match ? computeScore(match.events) : { home: 0, away: 0 });

  const filtered = match
    ? [...match.events]
        .filter((e) => filter === "all" || e.type === filter)
        .sort((a, b) => b.minute - a.minute || (b.minuteExtra ?? 0) - (a.minuteExtra ?? 0))
    : [];

  const eventStats = match
    ? {
        goals: match.events.filter((e) => e.type === "goal").length,
        yellows: match.events.filter((e) => e.type === "yellow_card").length,
        reds: match.events.filter((e) => e.type === "red_card").length,
      }
    : undefined;

  const statusLabel =
    !match ? "—"
    : match.status === "halftime" ? "Mi-temps"
    : match.status === "finished" ? "Terminé"
    : match.status === "upcoming" ? "À venir"
    : match.source === "football-data" && match.currentMinute > 0
      ? `${match.currentMinute}'`
    : `${liveMinute}'`;

  const canEditEvents =
    !!match &&
    match.status !== "finished" &&
    (match.source === "database" || match.source === "football-data");

  async function handleAdd() {
    if (!match) return;
    try {
      if (match.source === "database" && dbDetail) {
        const payload = dbEventFromForm(match.id, form, dbDetail.homeTeam.id, dbDetail.awayTeam.id);
        await createMatchEvent(payload);
        await loadDbMatch(match.id);
      } else if (match.source === "football-data" && footballDetail) {
        const payload = footballEventFromForm(
          match.id,
          form,
          footballDetail.match.homeTeamId,
          footballDetail.match.awayTeamId
        );
        await createFootballMatchEvent(payload);
        await loadFootballMatch(match.id);
      } else {
        return;
      }
      setShowForm(false);
      setForm({ ...BLANK_FORM, minute: liveMinute });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    }
  }

  async function handleCreateMatch() {
    if (createForm.homeTeamId === createForm.awayTeamId) {
      setCreateError("Choisissez deux équipes différentes.");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const id = nextMatchId(dbMatches.map((m) => m.id));
      const payload = {
        id,
        phase: "group_stage",
        group: createForm.group,
        homeTeamId: createForm.homeTeamId,
        awayTeamId: createForm.awayTeamId,
        kickoff: kickoffToIso(createForm.kickoff),
        status: createForm.status,
        score: { home: 0, away: 0 },
        ...(createForm.stadiumId ? { stadiumId: createForm.stadiumId } : {}),
      };
      await createMatch(payload);
      const matches = await fetchMatches();
      setDbMatches(matches);
      setShowCreateMatch(false);
      setCreateForm({ ...BLANK_CREATE_MATCH });
      setSourceTab("worldcup");
      await loadDbMatch(id);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Impossible de créer le match");
    } finally {
      setCreating(false);
    }
  }

  async function handleRemove(id: string) {
    if (!match || !canEditEvents) return;
    try {
      if (match.source === "database") {
        await deleteMatchEvent(id);
        await loadDbMatch(match.id);
      } else {
        await deleteFootballMatchEvent(id);
        await loadFootballMatch(match.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression");
    }
  }

  const explorer = (
    <MatchExplorer
      sourceTab={sourceTab}
      onSourceTab={setSourceTab}
      statusFilter={statusFilter}
      onStatusFilter={setStatusFilter}
      search={search}
      onSearch={setSearch}
      footballCompetition={footballCompetition}
      onCompetition={setFootballCompetition}
      dbMatches={worldcupDisplay}
      footballMatches={footballMatches}
      activeMatchId={match?.id}
      loading={loading && !dbMatches.length}
      footballLoading={footballLoading}
      footballError={footballError}
      footballStats={footballStats}
      onSelectDb={loadDbMatch}
      onSelectFootball={loadFootballMatch}
      onCreateMatch={() => {
        setCreateError(null);
        setCreateForm({ ...BLANK_CREATE_MATCH, kickoff: defaultKickoffLocal() });
        setShowCreateMatch(true);
      }}
    />
  );

  if (loading && !match) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Chargement…</p>
        </div>
      </div>
    );
  }

  if (error && !match) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-sm text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <p className="text-destructive text-sm">{error}</p>
          <p className="text-xs text-muted-foreground">
            Lancez <code className="text-primary">npm run server</code> puis{" "}
            <code className="text-primary">npm run seed</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center gap-3 px-4 py-3 border-b border-border bg-background/95 backdrop-blur-md">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 rounded-lg hover:bg-secondary cursor-pointer"
          aria-label="Menu matchs"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-lg">⚽</span>
          <div>
            <h1 className="text-sm font-black tracking-tight leading-none">Live Match Tracker</h1>
            <p className="text-[10px] text-muted-foreground">Scores & timeline en direct</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {match?.status === "live" && (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative rounded-full h-1.5 w-1.5 bg-primary" />
              </span>
              Live
            </span>
          )}
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-80 xl:w-96 shrink-0 border-r border-border flex-col bg-card/30">
          {explorer}
        </aside>

        {/* Mobile drawer */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
            <aside className="relative w-[min(100%,320px)] bg-card h-full flex flex-col shadow-2xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="font-bold text-sm">Choisir un match</span>
                <button onClick={() => setSidebarOpen(false)} className="text-xl cursor-pointer text-muted-foreground">×</button>
              </div>
              <div className="flex-1 min-h-0">{explorer}</div>
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-y-auto pb-20 lg:pb-6">
          {/* Mobile: show match list */}
          {mobileView === "matches" && (
            <div className="lg:hidden h-full">{explorer}</div>
          )}

          {/* Mobile: standings */}
          {mobileView === "standings" && sourceTab === "football" && (
            <div className="lg:hidden">
              <StandingsPanel standings={standings} competitionCode={footballCompetition} loading={footballLoading} />
            </div>
          )}

          {/* Match detail — toujours visible sur desktop, onglet Live sur mobile */}
          {match && (
            <div className={clsx("max-w-2xl mx-auto px-0 md:px-4 py-4", mobileView !== "detail" && "hidden lg:block")}>
              {error && (
                <div className="mx-4 mb-3 p-3 rounded-xl bg-destructive/10 text-destructive text-xs">{error}</div>
              )}

              <ScoreboardHero match={match} score={score} statusLabel={statusLabel} stats={eventStats} />

              <EventTimeline
                match={match}
                events={filtered}
                filter={filter}
                onFilter={setFilter}
                onRemove={canEditEvents ? handleRemove : undefined}
                canAdd={canEditEvents}
                onAdd={() => setShowForm(true)}
              />

              <div className="h-6" />
            </div>
          )}
        </main>

        {/* Desktop standings panel */}
        {sourceTab === "football" && (
          <aside className="hidden xl:flex w-72 shrink-0 border-l border-border flex-col bg-card/30">
            <StandingsPanel standings={standings} competitionCode={footballCompetition} loading={footballLoading} />
          </aside>
        )}
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex border-t border-border bg-background/95 backdrop-blur-md">
        {([
          { key: "matches" as const, label: "Matchs", icon: "📋" },
          { key: "detail" as const, label: "Live", icon: "⚽" },
          ...(sourceTab === "football" ? [{ key: "standings" as const, label: "Classement", icon: "🏆" }] : []),
        ] as { key: MobileView; label: string; icon: string }[]).map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setMobileView(key)}
            className={clsx(
              "flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium cursor-pointer transition-colors",
              mobileView === key ? "text-primary" : "text-muted-foreground"
            )}
          >
            <span className="text-base">{icon}</span>
            {label}
          </button>
        ))}
      </nav>

      {match && (
        <EventFormModal
          open={showForm}
          onClose={() => setShowForm(false)}
          form={form}
          onChange={setForm}
          onSubmit={handleAdd}
          homeCode={match.homeTeam.shortCode}
          awayCode={match.awayTeam.shortCode}
        />
      )}

      <CreateMatchModal
        open={showCreateMatch}
        onClose={() => setShowCreateMatch(false)}
        form={createForm}
        onChange={setCreateForm}
        onSubmit={handleCreateMatch}
        teams={teamList}
        stadiums={stadiums}
        submitting={creating}
        error={createError}
      />
    </div>
  );
}
