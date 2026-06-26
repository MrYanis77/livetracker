import clsx from "clsx";
import type { EventType, TeamSide } from "../types/match";

const eventMeta: Record<EventType, { label: string }> = {
  goal: { label: "But" },
  yellow_card: { label: "Carton jaune" },
  red_card: { label: "Carton rouge" },
  substitution: { label: "Remplacement" },
  kickoff: { label: "Coup d'envoi" },
  halftime: { label: "Mi-temps" },
  fulltime: { label: "Fin du match" },
  var: { label: "VAR" },
};

const TEAM_TYPES: EventType[] = ["goal", "yellow_card", "red_card", "substitution"];

interface EventFormModalProps {
  open: boolean;
  onClose: () => void;
  form: {
    minute: number;
    minuteExtra: string;
    type: EventType;
    team: TeamSide;
    playerName: string;
    playerOutName: string;
    note: string;
  };
  onChange: (form: EventFormModalProps["form"]) => void;
  onSubmit: () => void;
  homeCode: string;
  awayCode: string;
}

export function EventFormModal({
  open,
  onClose,
  form,
  onChange,
  onSubmit,
  homeCode,
  awayCode,
}: EventFormModalProps) {
  if (!open) return null;

  const needsTeam = TEAM_TYPES.includes(form.type);
  const needsPlayer = TEAM_TYPES.includes(form.type);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-bold">Ajouter un événement</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl cursor-pointer leading-none">×</button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Minute">
              <input
                type="number"
                value={form.minute}
                onChange={(e) => onChange({ ...form, minute: Number(e.target.value) })}
                min={1}
                max={120}
                className="w-full px-3 py-2.5 text-sm rounded-xl bg-secondary/60 border border-border/60 focus:outline-none focus:border-primary/50"
              />
            </Field>
            <Field label="Prolongation">
              <input
                type="number"
                value={form.minuteExtra}
                onChange={(e) => onChange({ ...form, minuteExtra: e.target.value })}
                placeholder="+3"
                className="w-full px-3 py-2.5 text-sm rounded-xl bg-secondary/60 border border-border/60 focus:outline-none focus:border-primary/50"
              />
            </Field>
          </div>

          <Field label="Type d'événement">
            <select
              value={form.type}
              onChange={(e) => onChange({ ...form, type: e.target.value as EventType })}
              className="w-full px-3 py-2.5 text-sm rounded-xl bg-secondary/60 border border-border/60 focus:outline-none focus:border-primary/50"
            >
              {Object.entries(eventMeta).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </Field>

          {needsTeam && (
            <Field label="Équipe">
              <div className="flex rounded-xl overflow-hidden border border-border">
                {(["home", "away"] as TeamSide[]).map((side) => (
                  <button
                    key={side}
                    onClick={() => onChange({ ...form, team: side })}
                    className={clsx(
                      "flex-1 py-2.5 text-sm font-semibold transition-colors cursor-pointer",
                      form.team === side
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {side === "home" ? homeCode : awayCode}
                  </button>
                ))}
              </div>
            </Field>
          )}

          {needsPlayer && (
            <Field label={form.type === "substitution" ? "Joueur entrant" : "Joueur"}>
              <input
                value={form.playerName}
                onChange={(e) => onChange({ ...form, playerName: e.target.value })}
                placeholder="Nom du joueur"
                className="w-full px-3 py-2.5 text-sm rounded-xl bg-secondary/60 border border-border/60 focus:outline-none focus:border-primary/50"
              />
            </Field>
          )}

          {form.type === "substitution" && (
            <Field label="Joueur sortant">
              <input
                value={form.playerOutName}
                onChange={(e) => onChange({ ...form, playerOutName: e.target.value })}
                placeholder="Nom du joueur"
                className="w-full px-3 py-2.5 text-sm rounded-xl bg-secondary/60 border border-border/60 focus:outline-none focus:border-primary/50"
              />
            </Field>
          )}

          <Field label="Note (optionnel)">
            <input
              value={form.note}
              onChange={(e) => onChange({ ...form, note: e.target.value })}
              placeholder="Description…"
              className="w-full px-3 py-2.5 text-sm rounded-xl bg-secondary/60 border border-border/60 focus:outline-none focus:border-primary/50"
            />
          </Field>
        </div>

        <div className="p-5 pt-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-border text-sm font-medium cursor-pointer hover:bg-secondary/50">
            Annuler
          </button>
          <button onClick={onSubmit} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold cursor-pointer hover:bg-primary/90">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}
