import clsx from "clsx";

export interface TeamOption {
  id: string;
  name: string;
  code: string;
  group: string;
}

export interface StadiumOption {
  id: string;
  name: string;
  city: string;
}

export interface CreateMatchForm {
  homeTeamId: string;
  awayTeamId: string;
  group: string;
  stadiumId: string;
  kickoff: string;
  status: "scheduled" | "live";
}

interface CreateMatchModalProps {
  open: boolean;
  onClose: () => void;
  form: CreateMatchForm;
  onChange: (form: CreateMatchForm) => void;
  onSubmit: () => void;
  teams: TeamOption[];
  stadiums: StadiumOption[];
  submitting?: boolean;
  error?: string | null;
}

const GROUPS = ["A", "B"];

const inputCls =
  "w-full px-3 py-2.5 text-sm rounded-xl bg-secondary/60 border border-border/60 focus:outline-none focus:border-primary/50";

export function CreateMatchModal({
  open,
  onClose,
  form,
  onChange,
  onSubmit,
  teams,
  stadiums,
  submitting,
  error,
}: CreateMatchModalProps) {
  if (!open) return null;

  const sameTeam = form.homeTeamId && form.homeTeamId === form.awayTeamId;
  const canSubmit =
    form.homeTeamId && form.awayTeamId && form.kickoff && !sameTeam && !submitting;

  function handleHomeChange(homeTeamId: string) {
    const team = teams.find((t) => t.id === homeTeamId);
    onChange({
      ...form,
      homeTeamId,
      group: team?.group ?? form.group,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-bold">Nouveau match</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xl cursor-pointer leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs">{error}</div>
          )}

          <Field label="Équipe domicile">
            <select
              value={form.homeTeamId}
              onChange={(e) => handleHomeChange(e.target.value)}
              className={inputCls}
            >
              <option value="">— Choisir —</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id} disabled={t.id === form.awayTeamId}>
                  {t.code} — {t.name} (Groupe {t.group})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Équipe extérieur">
            <select
              value={form.awayTeamId}
              onChange={(e) => onChange({ ...form, awayTeamId: e.target.value })}
              className={inputCls}
            >
              <option value="">— Choisir —</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id} disabled={t.id === form.homeTeamId}>
                  {t.code} — {t.name} (Groupe {t.group})
                </option>
              ))}
            </select>
          </Field>

          {sameTeam && (
            <p className="text-xs text-destructive">Les deux équipes doivent être différentes.</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Groupe">
              <select
                value={form.group}
                onChange={(e) => onChange({ ...form, group: e.target.value })}
                className={inputCls}
              >
                {GROUPS.map((g) => (
                  <option key={g} value={g}>Groupe {g}</option>
                ))}
              </select>
            </Field>
            <Field label="Statut">
              <select
                value={form.status}
                onChange={(e) =>
                  onChange({ ...form, status: e.target.value as CreateMatchForm["status"] })
                }
                className={inputCls}
              >
                <option value="scheduled">À venir</option>
                <option value="live">En direct</option>
              </select>
            </Field>
          </div>

          <Field label="Date et heure">
            <input
              type="datetime-local"
              value={form.kickoff}
              onChange={(e) => onChange({ ...form, kickoff: e.target.value })}
              className={inputCls}
            />
          </Field>

          <Field label="Stade (optionnel)">
            <select
              value={form.stadiumId}
              onChange={(e) => onChange({ ...form, stadiumId: e.target.value })}
              className={inputCls}
            >
              <option value="">— Aucun —</option>
              {stadiums.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.city})
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="p-5 pt-0 flex gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl border border-border text-sm font-medium cursor-pointer hover:bg-secondary/50 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            className={clsx(
              "flex-1 py-3 rounded-xl text-sm font-bold cursor-pointer transition-colors",
              canSubmit
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {submitting ? "Création…" : "Créer le match"}
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

export function nextMatchId(existingIds: string[]): string {
  const nums = existingIds
    .map((id) => parseInt(id.replace("match_", ""), 10))
    .filter((n) => !Number.isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `match_${String(next).padStart(3, "0")}`;
}

export function kickoffToIso(localDatetime: string): string {
  if (!localDatetime) return new Date().toISOString();
  return new Date(localDatetime).toISOString();
}

export function defaultKickoffLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export const BLANK_CREATE_MATCH: CreateMatchForm = {
  homeTeamId: "",
  awayTeamId: "",
  group: "A",
  stadiumId: "",
  kickoff: "",
  status: "scheduled",
};
