import { createClient } from "@/lib/supabase/server";
import { addGoal, updateGoalAmount, deleteGoal } from "@/app/actions";
import ProgressBar from "@/components/ProgressBar";
import { formatEuro } from "@/lib/date";

function mesiMancanti(dataTarget: string | null) {
  if (!dataTarget) return null;
  const oggi = new Date();
  const target = new Date(dataTarget);
  const mesi =
    (target.getFullYear() - oggi.getFullYear()) * 12 + (target.getMonth() - oggi.getMonth());
  return mesi;
}

export default async function ObiettiviPage() {
  const supabase = createClient();
  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main style={{ padding: 32, maxWidth: 640, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, marginBottom: 24 }}>Obiettivi finanziari</h1>

      <div style={{ display: "grid", gap: 12, marginBottom: 24 }}>
        {(goals ?? []).map((g) => {
          const mesi = mesiMancanti(g.data_target);
          const mancante = Number(g.importo_target) - Number(g.importo_attuale);
          const rataConsigliata = mesi && mesi > 0 ? mancante / mesi : null;
          return (
            <div key={g.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 15 }}>{g.nome}</div>
                <form action={deleteGoal.bind(null, g.id)}>
                  <button type="submit" style={deleteBtnStyle} aria-label="Elimina">
                    ✕
                  </button>
                </form>
              </div>
              <ProgressBar done={Number(g.importo_attuale)} total={Number(g.importo_target)} />
              <div
                className="tabular"
                style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 8 }}
              >
                {formatEuro(g.importo_attuale)} di {formatEuro(g.importo_target)}
                {g.data_target &&
                  ` · entro ${new Date(g.data_target).toLocaleDateString("it-IT")}`}
              </div>
              {rataConsigliata !== null && rataConsigliata > 0 && (
                <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 2 }}>
                  Per arrivarci servono circa{" "}
                  <span className="tabular">{formatEuro(rataConsigliata)}</span>/mese per{" "}
                  {mesi} mesi
                </div>
              )}
              <form
                action={updateGoalAmount.bind(null, g.id)}
                style={{ display: "flex", gap: 8, marginTop: 12 }}
              >
                <input
                  name="importo_attuale"
                  type="number"
                  step="0.01"
                  defaultValue={g.importo_attuale}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button type="submit" style={btnStyle}>
                  Aggiorna
                </button>
              </form>
            </div>
          );
        })}
        {(goals ?? []).length === 0 && (
          <p style={{ fontSize: 14, color: "var(--ink-soft)" }}>Nessun obiettivo impostato.</p>
        )}
      </div>

      <h2 style={{ fontSize: 15, marginBottom: 12 }}>Nuovo obiettivo</h2>
      <form action={addGoal} className="card" style={{ padding: 20 }}>
        <div style={{ display: "grid", gap: 10 }}>
          <input name="nome" placeholder="Nome (es. Fondo emergenza)" required style={inputStyle} />
          <input
            name="importo_target"
            type="number"
            step="0.01"
            placeholder="Importo target"
            required
            style={inputStyle}
          />
          <input
            name="importo_attuale"
            type="number"
            step="0.01"
            placeholder="Importo già raggiunto (opzionale)"
            style={inputStyle}
          />
          <input name="data_target" type="date" placeholder="Data entro cui raggiungerlo" style={inputStyle} />
          <button type="submit" style={btnStyle}>
            Crea obiettivo
          </button>
        </div>
      </form>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  border: "1px solid var(--line)",
  borderRadius: 12,
  fontSize: 14,
  fontFamily: "var(--font-ui)",
};

const btnStyle: React.CSSProperties = {
  padding: "10px 12px",
  background: "var(--accent)",
  color: "var(--on-accent)",
  border: "none",
  borderRadius: 12,
  fontSize: 14,
  cursor: "pointer",
};

const deleteBtnStyle: React.CSSProperties = {
  border: "none",
  background: "none",
  color: "var(--ink-soft)",
  cursor: "pointer",
  fontSize: 13,
};
