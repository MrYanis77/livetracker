import clsx from "clsx";
import type { FootballStanding } from "../types/match";

interface StandingsPanelProps {
  standings: FootballStanding[];
  competitionCode: string;
  loading?: boolean;
}

export function StandingsPanel({ standings, competitionCode, loading }: StandingsPanelProps) {
  const table = standings[0]?.table ?? [];

  if (loading) {
    return (
      <div className="p-4 space-y-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-8 rounded-lg bg-secondary/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!table.length) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        Classement non disponible
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-bold">Classement</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">{competitionCode} · Saison en cours</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-card text-muted-foreground">
            <tr className="border-b border-border">
              <th className="py-2 pl-3 text-left font-medium w-8">#</th>
              <th className="py-2 text-left font-medium">Équipe</th>
              <th className="py-2 text-center font-medium w-8">J</th>
              <th className="py-2 pr-3 text-right font-medium w-10">Pts</th>
            </tr>
          </thead>
          <tbody>
            {table.map((row) => (
              <tr
                key={row.position}
                className={clsx(
                  "border-b border-border/40 hover:bg-secondary/30 transition-colors",
                  row.position <= 4 && "bg-primary/[0.03]",
                  row.position >= table.length - 3 && "bg-destructive/[0.03]"
                )}
              >
                <td className="py-2.5 pl-3 font-bold text-muted-foreground">{row.position}</td>
                <td className="py-2.5 pr-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {row.teamCrest && (
                      <img src={row.teamCrest} alt="" className="w-4 h-4 object-contain shrink-0" />
                    )}
                    <span className="truncate font-medium">{row.teamName}</span>
                  </div>
                  {row.form && (
                    <div className="flex gap-0.5 mt-0.5">
                      {row.form.split(",").slice(-5).map((f, i) => (
                        <span
                          key={i}
                          className={clsx(
                            "w-3.5 h-3.5 rounded-sm text-[8px] flex items-center justify-center font-bold",
                            f.trim() === "W" && "bg-primary/30 text-primary",
                            f.trim() === "D" && "bg-muted text-muted-foreground",
                            f.trim() === "L" && "bg-destructive/20 text-destructive"
                          )}
                        >
                          {f.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="py-2.5 text-center text-muted-foreground">{row.playedGames}</td>
                <td className="py-2.5 pr-3 text-right font-black">{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
