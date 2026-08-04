import { createClient } from "@/lib/supabase/server";
import { addIncome, deleteIncome } from "@/app/actions";
import PeriodFilter from "@/components/PeriodFilter";
import { formatEuro, todayLocalISO } from "@/lib/date";
import { getPeriodo } from "@/lib/periodo";

export default async function EntratePage({
  searchParams,
}: {
  searchParams: { p?: string; ref?: string; da?: string; a?: string };
}) {
  const supabase = createClient();
  const periodo = getPeriodo(searchParams);

  const { data: incomes } = await supabase
    .from("incomes")
    .select("*")
    .gte("data", periodo.start)
    .lt("data", periodo.end)
    .order("data", { ascending: true });

  const totale = (incomes ?? []).reduce((sum, i) => sum + Number(i.importo), 0);

  return (
    <main style={{ padding: "24px 20px 32px", maxWidth: 640, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Entrate</h1>
        <details>
          <summary style={addBtnStyle}>+ Aggiungi</summary>
          <form
            action={addIncome}
            className="card"
            style={{ padding: 16, marginTop: 8, display: "grid", gap: 8, position: "absolute", right: 20, zIndex: 10, width: 260 }}
          >
            <input name="fonte" placeholder="Fonte (es. Stipendio)" required style={inputStyle} />
            <input name="data" type="date" required style={inputStyle} defaultValue={todayLocalISO()} />
            <input name="importo" type="number" step="0.01" placeholder="Importo" required style={inputStyle} />
            <input name="note" placeholder="Note (opzionale)" style={inputStyle} />
            <button type="submit" style={btnStyle}>Aggiungi</button>
          </form>
        </details>
      </div>

      <PeriodFilter />

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>Totale — {periodo.label}</div>
        <div className="tabular positive" style={{ fontSize: 26, fontWeight: 700 }}>{formatEuro(totale)}</div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        {(incomes ?? []).map((i, idx) => (
          <div
            key={i.id}
            style={{
              padding: "12px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: idx < (incomes?.length ?? 0) - 1 ? "1px solid var(--line)" : "none",
            }}
          >
            <div>
              <div style={{ fontSize: 14 }}>{i.fonte}</div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                {new Date(i.data).toLocaleDateString("it-IT")}
                {i.note ? ` · ${i.note}` : ""}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="tabular positive">{formatEuro(i.importo)}</span>
              <form action={deleteIncome.bind(null, i.id)}>
                <button type="submit" style={deleteBtnStyle} aria-label="Elimina">✕</button>
              </form>
            </div>
          </div>
        ))}
        {(incomes ?? []).length === 0 && (
          <p style={{ fontSize: 14, color: "var(--ink-soft)", padding: 20 }}>Nessuna entrata in questo periodo.</p>
        )}
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  border: "1px solid var(--line)",
  fontSize: 14,
  background: "var(--card)",
  color: "var(--ink)",
};

const btnStyle: React.CSSProperties = {
  padding: "10px 12px",
  background: "var(--accent)",
  color: "white",
  border: "none",
  fontSize: 14,
  cursor: "pointer",
};

const addBtnStyle: React.CSSProperties = {
  padding: "8px 14px",
  background: "var(--accent)",
  color: "white",
  borderRadius: 999,
  fontSize: 13,
  cursor: "pointer",
  listStyle: "none",
};

const deleteBtnStyle: React.CSSProperties = {
  border: "none",
  background: "none",
  color: "var(--ink-soft)",
  cursor: "pointer",
  fontSize: 13,
};
