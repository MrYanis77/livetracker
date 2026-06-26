import clsx from "clsx";
import type { MatchState } from "../types/match";

interface ScoreboardHeroProps {
  match: MatchState;
  score: { home: number; away: number };
  statusLabel: string;
  stats?: { goals: number; yellows: number; reds: number };
}

export function ScoreboardHero({ match, score, statusLabel, stats }: ScoreboardHeroProps) {
  const isLive = match.status === "live";

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-card to-secondary/30 border border-border/60 mx-4 mt-4 md:mx-0">
      {isLive && (
        <div className="absolute inset-0 bg-primary/[0.03] pointer-events-none" />
      )}

      <div className="px-4 pt-4 pb-1 text-center">
        <p className="text-[11px] text-muted-foreground uppercase tracking-widest truncate">
          {match.competition}
        </p>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span
            className={clsx(
              "text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full",
              match.source === "database"
                ? "bg-primary/15 text-primary"
                : "bg-orange-500/15 text-orange-400"
            )}
          >
            {match.source === "database" ? "Coupe du Monde" : "Championnat"}
          </span>
          {isLive && (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative rounded-full h-1.5 w-1.5 bg-primary" />
              </span>
              Live
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-6">
        <TeamBlock team={match.homeTeam} align="right" highlight={score.home >= score.away} />
        <ScoreBlock home={score.home} away={score.away} status={statusLabel} />
        <TeamBlock team={match.awayTeam} align="left" highlight={score.away > score.home} />
      </div>

      {stats && (
        <div className="flex justify-center gap-4 px-4 pb-4 text-[11px] text-muted-foreground">
          <span>⚽ {stats.goals} buts</span>
          <span className="text-yellow-400">■ {stats.yellows}</span>
          <span className="text-red-500">■ {stats.reds}</span>
          <span>{match.events.length} événements</span>
        </div>
      )}
    </section>
  );
}

function TeamBlock({
  team,
  align,
  highlight,
}: {
  team: { name: string; shortCode: string; color: string; crest?: string | null };
  align: "left" | "right";
  highlight: boolean;
}) {
  return (
    <div className={clsx("flex flex-col gap-2", align === "right" ? "items-end" : "items-start")}>
      <div className={clsx("flex items-center gap-2", align === "right" && "flex-row-reverse")}>
        {team.crest ? (
          <img src={team.crest} alt="" className="w-10 h-10 md:w-12 md:h-12 object-contain" />
        ) : (
          <div
            className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-xs font-black"
            style={{ backgroundColor: `${team.color}22`, color: team.color, border: `2px solid ${team.color}` }}
          >
            {team.shortCode.slice(0, 2)}
          </div>
        )}
        <span
          className={clsx(
            "text-2xl md:text-3xl font-black tracking-tight",
            highlight ? "text-primary" : "text-foreground/70"
          )}
        >
          {team.shortCode}
        </span>
      </div>
      <span className="text-[11px] text-muted-foreground truncate max-w-[120px] text-center">
        {team.name}
      </span>
    </div>
  );
}

function ScoreBlock({ home, away, status }: { home: number; away: number; status: string }) {
  return (
    <div className="flex flex-col items-center px-2">
      <div className="flex items-center gap-2 md:gap-3">
        <span className="text-5xl md:text-6xl font-black tabular-nums leading-none">{home}</span>
        <span className="text-xl text-muted-foreground font-light">:</span>
        <span className="text-5xl md:text-6xl font-black tabular-nums leading-none">{away}</span>
      </div>
      <span className="mt-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1 rounded-full bg-secondary/80">
        {status}
      </span>
    </div>
  );
}
