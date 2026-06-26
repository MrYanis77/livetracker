import clsx from "clsx";
import type { MatchEvent, MatchState, EventType, FilterType } from "../types/match";

const eventMeta: Record<EventType, { label: string; icon: string; accent: string }> = {
  goal:         { label: "But",          icon: "⚽", accent: "#c8ff00" },
  yellow_card:  { label: "Carton J.",    icon: "■",  accent: "#ffd600" },
  red_card:     { label: "Carton R.",    icon: "■",  accent: "#ff3d00" },
  substitution: { label: "Remplacement", icon: "↕",  accent: "#60a5fa" },
  kickoff:      { label: "Coup d'envoi", icon: "▶",  accent: "#636366" },
  halftime:     { label: "Mi-temps",     icon: "⏸",  accent: "#636366" },
  fulltime:     { label: "Fin",          icon: "⏹",  accent: "#636366" },
  var:          { label: "VAR",          icon: "◉",  accent: "#ff9900" },
};

const SYSTEM_TYPES: EventType[] = ["kickoff", "halftime", "fulltime", "var"];

const FILTER_OPTIONS: { key: FilterType; label: string; icon: string }[] = [
  { key: "all",          label: "Tous",     icon: "☰" },
  { key: "goal",         label: "Buts",     icon: "⚽" },
  { key: "yellow_card",  label: "Jaunes",   icon: "🟨" },
  { key: "red_card",     label: "Rouges",   icon: "🟥" },
  { key: "substitution", label: "Subs",     icon: "↕" },
  { key: "var",          label: "VAR",      icon: "◉" },
];

interface EventTimelineProps {
  match: MatchState;
  events: MatchEvent[];
  filter: FilterType;
  onFilter: (f: FilterType) => void;
  onRemove?: (id: string) => void;
  canAdd?: boolean;
  onAdd?: () => void;
}

export function EventTimeline({ match, events, filter, onFilter, onRemove, canAdd, onAdd }: EventTimelineProps) {
  return (
    <div className="mt-4 mx-4 md:mx-0">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-sm font-bold">Timeline</h3>
        {canAdd && onAdd && (
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold cursor-pointer hover:bg-primary/90"
          >
            + Événement
          </button>
        )}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3">
        {FILTER_OPTIONS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => onFilter(key)}
            className={clsx(
              "shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
              filter === key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/60 text-muted-foreground hover:text-foreground"
            )}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/50 overflow-hidden">
        {events.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Aucun événement pour ce filtre
          </div>
        ) : (
          events.map((event, i) => (
            <TimelineRow
              key={event.id}
              event={event}
              match={match}
              isLast={i === events.length - 1}
              onRemove={onRemove}
            />
          ))
        )}
      </div>
    </div>
  );
}

function TimelineRow({
  event,
  match,
  isLast,
  onRemove,
}: {
  event: MatchEvent;
  match: MatchState;
  isLast: boolean;
  onRemove?: (id: string) => void;
}) {
  const meta = eventMeta[event.type];
  const isSystem = SYSTEM_TYPES.includes(event.type);
  const minLabel = `${event.minute}${event.minuteExtra ? `+${event.minuteExtra}` : ""}'`;

  if (isSystem) {
    return (
      <div className={clsx("flex items-center gap-3 px-4 py-3", !isLast && "border-b border-border/40")}>
        <div className="flex-1 h-px bg-border/60" />
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold tabular-nums text-muted-foreground">{minLabel}</span>
          <span className="text-xs font-medium" style={{ color: meta.accent }}>
            {event.note ?? meta.label}
          </span>
        </div>
        <div className="flex-1 h-px bg-border/60" />
      </div>
    );
  }

  const isHome = event.team === "home";
  const teamColor = isHome ? match.homeTeam.color : match.awayTeam.color;

  return (
    <div
      className={clsx(
        "group flex items-stretch gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors",
        !isLast && "border-b border-border/40"
      )}
    >
      <div className="w-10 shrink-0 flex flex-col items-center pt-0.5">
        <span className="text-[11px] font-bold tabular-nums text-muted-foreground">{minLabel}</span>
        <div className="w-0.5 flex-1 mt-1 rounded-full opacity-40" style={{ backgroundColor: teamColor }} />
      </div>

      <div
        className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-sm border"
        style={{
          borderColor: meta.accent,
          backgroundColor: event.type === "goal" ? meta.accent : "transparent",
          color: event.type === "goal" ? "var(--primary-foreground)" : meta.accent,
        }}
      >
        {meta.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold truncate">{event.playerName ?? meta.label}</span>
          <span
            className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
            style={{ backgroundColor: `${teamColor}22`, color: teamColor }}
          >
            {isHome ? match.homeTeam.shortCode : match.awayTeam.shortCode}
          </span>
        </div>
        {event.type === "substitution" && event.playerOutName && (
          <p className="text-xs text-muted-foreground mt-0.5">↓ {event.playerOutName}</p>
        )}
        {event.note && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{event.note}</p>
        )}
      </div>

      {onRemove && (
        <button
          onClick={() => onRemove(event.id)}
          className="opacity-0 group-hover:opacity-100 self-center text-muted-foreground hover:text-destructive text-sm cursor-pointer transition-opacity shrink-0"
          title="Supprimer"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export { eventMeta };
