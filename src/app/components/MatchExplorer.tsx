import clsx from "clsx";
import type { DbMatchSummary, ExternalMatchSummary } from "../types/match";

export interface WorldCupDisplayMatch extends DbMatchSummary {
  homeCode: string;
  awayCode: string;
  homeName?: string;
  awayName?: string;
}

type SourceTab = "worldcup" | "football";
type StatusFilter = "all" | "live" | "finished" | "upcoming";

const COMPETITIONS = [
  { code: "PL", label: "Premier League", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { code: "FL1", label: "Ligue 1", flag: "🇫🇷" },
  { code: "PD", label: "La Liga", flag: "🇪🇸" },
  { code: "BL1", label: "Bundesliga", flag: "🇩🇪" },
  { code: "SA", label: "Serie A", flag: "🇮🇹" },
  { code: "CL", label: "Champions League", flag: "🏆" },
];

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "live", label: "En direct" },
  { key: "finished", label: "Terminés" },
  { key: "upcoming", label: "À venir" },
];

function normStatus(s: string): StatusFilter {
  if (s === "live" || s === "halftime") return "live";
  if (s === "finished") return "finished";
  return "upcoming";
}

function StatusPill({ status }: { status: string }) {
  const n = normStatus(status);
  return (
    <span
      className={clsx(
        "text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full",
        n === "live" && "bg-primary text-primary-foreground animate-pulse",
        n === "finished" && "bg-secondary text-muted-foreground",
        n === "upcoming" && "bg-muted text-muted-foreground"
      )}
    >
      {n === "live" ? "Live" : n === "finished" ? "FT" : "À venir"}
    </span>
  );
}

function MatchCard({
  active,
  onClick,
  homeCode,
  awayCode,
  homeName,
  awayName,
  homeCrest,
  awayCrest,
  scoreHome,
  scoreAway,
  status,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  homeCode: string;
  awayCode: string;
  homeName?: string;
  awayName?: string;
  homeCrest?: string | null;
  awayCrest?: string | null;
  scoreHome: number;
  scoreAway: number;
  status: string;
  subtitle: string;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full text-left p-3 rounded-xl border transition-all cursor-pointer group",
        active
          ? "bg-primary/10 border-primary/50 shadow-[0_0_0_1px_rgba(200,255,0,0.2)]"
          : "bg-card border-border/60 hover:border-border hover:bg-secondary/50"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-muted-foreground truncate">{subtitle}</span>
        <StatusPill status={status} />
      </div>
      <div className="flex items-center gap-2">
        <TeamLine code={homeCode} name={homeName} crest={homeCrest} />
        <span className="text-lg font-black tabular-nums shrink-0 px-1">
          {scoreHome}<span className="text-muted-foreground mx-0.5">-</span>{scoreAway}
        </span>
        <TeamLine code={awayCode} name={awayName} crest={awayCrest} align="right" />
      </div>
    </button>
  );
}

function TeamLine({
  code,
  name,
  crest,
  align = "left",
}: {
  code: string;
  name?: string;
  crest?: string | null;
  align?: "left" | "right";
}) {
  return (
    <div className={clsx("flex-1 flex items-center gap-1.5 min-w-0", align === "right" && "flex-row-reverse")}>
      {crest ? (
        <img src={crest} alt="" className="w-5 h-5 object-contain shrink-0" />
      ) : (
        <div className="w-5 h-5 rounded-full bg-secondary shrink-0" />
      )}
      <div className={clsx("min-w-0", align === "right" ? "text-right" : "text-left")}>
        <div className="text-sm font-bold truncate">{code}</div>
        {name && <div className="text-[10px] text-muted-foreground truncate">{name}</div>}
      </div>
    </div>
  );
}

export interface MatchExplorerProps {
  sourceTab: SourceTab;
  onSourceTab: (t: SourceTab) => void;
  statusFilter: StatusFilter;
  onStatusFilter: (f: StatusFilter) => void;
  search: string;
  onSearch: (s: string) => void;
  footballCompetition: string;
  onCompetition: (c: string) => void;
  dbMatches: WorldCupDisplayMatch[];
  footballMatches: ExternalMatchSummary[];
  activeMatchId?: string;
  loading: boolean;
  footballLoading: boolean;
  footballError: string | null;
  footballStats: { counts: Record<string, number> } | null;
  onSelectDb: (id: string) => void;
  onSelectFootball: (id: string) => void;
  onCreateMatch?: () => void;
}

export function MatchExplorer({
  sourceTab,
  onSourceTab,
  statusFilter,
  onStatusFilter,
  search,
  onSearch,
  footballCompetition,
  onCompetition,
  dbMatches,
  footballMatches,
  activeMatchId,
  loading,
  footballLoading,
  footballError,
  footballStats,
  onSelectDb,
  onSelectFootball,
  onCreateMatch,
}: MatchExplorerProps) {
  const q = search.toLowerCase().trim();

  const filteredDb = dbMatches
    .filter((m) => statusFilter === "all" || normStatus(m.status) === statusFilter)
    .sort((a, b) => {
      if (a.status === "live" && b.status !== "live") return -1;
      if (b.status === "live" && a.status !== "live") return 1;
      return 0;
    });

  const filteredFootball = footballMatches
    .filter((m) => statusFilter === "all" || normStatus(m.status) === statusFilter)
    .filter((m) => {
      if (!q) return true;
      return (
        m.homeTeam.name.toLowerCase().includes(q) ||
        m.awayTeam.name.toLowerCase().includes(q) ||
        m.homeTeam.shortCode.toLowerCase().includes(q) ||
        m.awayTeam.shortCode.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (a.status === "live" && b.status !== "live") return -1;
      if (b.status === "live" && a.status !== "live") return 1;
      return new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime();
    });

  const isLoading = sourceTab === "worldcup" ? loading : footballLoading;
  const list = sourceTab === "worldcup" ? filteredDb : filteredFootball;

  return (
    <div className="flex flex-col h-full">
      {/* Source tabs */}
      <div className="p-3 border-b border-border">
        <div className="flex rounded-xl bg-secondary/80 p-1 gap-1">
          {([
            { key: "worldcup" as const, label: "Coupe du Monde", icon: "🏆" },
            { key: "football" as const, label: "Championnats", icon: "⚽" },
          ]).map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => onSourceTab(key)}
              className={clsx(
                "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                sourceTab === key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span>{icon}</span>
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Competition pills (football only) */}
      {sourceTab === "football" && (
        <div className="px-3 pt-3 pb-1 flex gap-1.5 overflow-x-auto scrollbar-none">
          {COMPETITIONS.map((c) => (
            <button
              key={c.code}
              onClick={() => onCompetition(c.code)}
              className={clsx(
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer",
                footballCompetition === c.code
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {c.flag} {c.code}
            </button>
          ))}
        </div>
      )}

      {/* Search + create */}
      <div className="px-3 py-2 space-y-2">
        {sourceTab === "worldcup" && onCreateMatch && (
          <button
            onClick={onCreateMatch}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold cursor-pointer hover:bg-primary/90 transition-colors"
          >
            + Nouveau match
          </button>
        )}
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={sourceTab === "football" ? "Rechercher une équipe…" : "Filtrer les matchs…"}
          className="w-full px-3 py-2 text-sm rounded-xl bg-secondary/60 border border-border/60 placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
        />
      </div>

      {/* Status filters */}
      <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto scrollbar-none">
        {STATUS_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onStatusFilter(key)}
            className={clsx(
              "shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer",
              statusFilter === key
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Stats bar */}
      {sourceTab === "football" && footballStats && (
        <div className="px-3 pb-2 text-[10px] text-muted-foreground">
          {footballStats.counts.matches} matchs · {footballStats.counts.teams} équipes en base
        </div>
      )}

      {footballError && sourceTab === "football" && (
        <div className="mx-3 mb-2 p-2 rounded-lg bg-destructive/10 text-destructive text-xs">
          {footballError}
        </div>
      )}

      {/* Match list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-secondary/40 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && list.length === 0 && (
          <div className="text-center py-10 text-sm text-muted-foreground">
            Aucun match trouvé
          </div>
        )}

        {!isLoading && sourceTab === "worldcup" &&
          filteredDb.map((m) => (
            <MatchCard
              key={m.id}
              active={activeMatchId === m.id}
              onClick={() => onSelectDb(m.id)}
              homeCode={m.homeCode}
              awayCode={m.awayCode}
              homeName={m.homeName}
              awayName={m.awayName}
              scoreHome={m.score.home}
              scoreAway={m.score.away}
              status={m.status}
              subtitle={`Groupe ${m.group} · Match ${m.id.replace("match_", "#")}`}
            />
          ))}

        {!isLoading && sourceTab === "football" &&
          filteredFootball.map((m) => (
            <MatchCard
              key={m.id}
              active={activeMatchId === m.id}
              onClick={() => onSelectFootball(m.id)}
              homeCode={m.homeTeam.shortCode}
              awayCode={m.awayTeam.shortCode}
              homeName={m.homeTeam.name}
              awayName={m.awayTeam.name}
              homeCrest={m.homeTeam.crest}
              awayCrest={m.awayTeam.crest}
              scoreHome={m.score.home}
              scoreAway={m.score.away}
              status={m.status}
              subtitle={`J${m.matchday ?? "?"} · ${m.competition}`}
            />
          ))}
      </div>
    </div>
  );
}

export type { SourceTab, StatusFilter };
