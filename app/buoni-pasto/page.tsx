import { createClient } from "@/lib/supabase/server";
import { addBuonoCategory, addBuonoTransaction, deleteBuonoTransaction } from "@/app/actions";
import PeriodFilter from "@/components/PeriodFilter";
import PieChart from "@/components/PieChart";
import { formatEuro, todayLocalISO } from "@/lib/date";
import { getPeriodo } from "@/lib/periodo";
import { breakdownBuoniNelPeriodo, andamentoMensile } from "@/lib/patrimonio";

export default async function BuoniPastoPage({
  searchParams,
}: {
  searchParams: { p?: string; ref?: string; da?: string; a?: string };
}) {
  const supabase = createClient();
  const periodo = getPeriodo(searchParams);

  const { data: categories } = await supabase
    .from("buono_categories")
    .select("*")
    .eq("attiva", true)
    .order("nome");

  const { data: transactions } = await supabase
    .from("buono_transactions")
    .select("*, buono_categories(nome)")
    .gte("data", periodo.start)
    .lt("data", periodo.end)
    .order("data", { ascending: true });

  const totale = (transactions ?? []).reduce((sum, t) => sum + Number(t.importo), 0);
  const breakdown = await breakdownBuoniNelPeriodo(supabase, periodo.start, periodo.end);
  const andamento = await andamentoMensile(supabase, "buoni");

  return (
    <main style={{ padding: "24px 20px 32px", maxWidth: 640, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Buoni pasto</h1>
        <details>
          <summary style={addBtnStyle}>+ Aggiungi</summary>
          <form
            action={addBuonoTransaction}
            className="card"
            style={{ padding: 16, marginTop: 8, display: "grid", gap: 8, position: "absolute", right: 20, zIndex: 10, width: 260 }}
          >
            <select name="category_id" required style={inputStyle} defaultValue="">
              <option value="" disabled>Categoria</option>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
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
        <div className="tabular negative" style={{ fontSize: 26, fontWeight: 700 }}>{formatEuro(totale)}</div>
      </div>

      {breakdown.length > 0 && (
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 12 }}>Per categoria</div>
          <PieChart items={breakdown} />
        </div>
      )}

      <details className="card" style={{ padding: 16, marginBottom: 16 }}>
        <summary style={{ cursor: "pointer", fontSize: 13, color: "var(--ink-soft)" }}>Gestisci categorie</summary>
        <form action={addBuonoCategory} style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input name="nome" placeholder="Nuova categoria" required style={{ ...inputStyle, flex: 1 }} />
          <button type="submit" style={btnStyle}>Aggiungi</button>
        </form>
      </details>

      <div className="card" style={{ overflow: "hidden", marginBottom: 16 }}>
        {(transactions ?? []).map((t, idx) => (
          <div
            key={t.id}
            style={{
              padding: "12px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: idx < (transactions?.length ?? 0) - 1 ? "1px solid var(--line)" : "none",
            }}
          >
            <div>
              <div style={{ fontSize: 14 }}>{(t as any).buono_categories?.nome ?? "Senza categoria"}</div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                {new Date(t.data).toLocaleDateString("it-IT")}
                {t.note ? ` · ${t.note}` : ""}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="tabular negative">{formatEuro(t.importo)}</span>
              <form action={deleteBuonoTransaction.bind(null, t.id)}>
                <button type="submit" style={deleteBtnStyle} aria-label="Elimina">✕</button>
              </form>
            </div>
          </div>
        ))}
        {(transactions ?? []).length === 0 && (
          <p style={{ fontSize: 14, color: "var(--ink-soft)", padding: 20 }}>Nessuna spesa in questo periodo.</p>
        )}
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 12 }}>Andamento mensile (buoni pasto)</div>
        <div style={{ display: "grid", gap: 8 }}>
          {andamento.map((m) => (
            <div key={`${m.mese}-${m.anno}`} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--line)", fontSize: 13 }}>
              <span>{m.mese}/{m.anno}</span>
              <span className="tabular positive">+{formatEuro(m.entrate)}</span>
              <span className="tabular negative">-{formatEuro(m.uscite)}</span>
              <span className="tabular" style={{ fontWeight: 700 }}>{formatEuro(m.cumulato)}</span>
            </div>
          ))}
          {andamento.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Nessun dato ancora — appena registri entrate/uscite buoni pasto vedrai qui l'andamento mese per mese.</p>
          )}
        </div>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
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
};

const deleteBtnStyle: React.CSSProperties = {
  border: "none",
  background: "none",
  color: "var(--ink-soft)",
  cursor: "pointer",
  fontSize: 13,
};
