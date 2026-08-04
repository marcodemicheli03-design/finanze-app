import { createClient } from "@/lib/supabase/server";
import { addFixedExpense, updateFixedExpensePayment } from "@/app/actions";
import MonthNav from "@/components/MonthNav";
import ProgressBar from "@/components/ProgressBar";
import { currentMonthYear, formatEuro, importoEffettivo, parseLocalDate } from "@/lib/date";

function rateVersate(dataInizio: string, mese: number, anno: number) {
  const inizio = parseLocalDate(dataInizio);
  const oggiRif = new Date(anno, mese - 1, 1);
  const mesi =
    (oggiRif.getFullYear() - inizio.getFullYear()) * 12 +
    (oggiRif.getMonth() - inizio.getMonth()) +
    1;
  return Math.max(0, mesi);
}

export default async function SpeseFissePage({
  searchParams,
}: {
  searchParams: { mese?: string; anno?: string };
}) {
  const supabase = createClient();
  const current = currentMonthYear();
  const mese = Number(searchParams.mese) || current.mese;
  const anno = Number(searchParams.anno) || current.anno;

  const { data: expenses } = await supabase
    .from("fixed_expenses")
    .select("*")
    .eq("attiva", true)
    .order("giorno_scadenza", { ascending: true });

  const { data: payments } = await supabase
    .from("fixed_expense_payments")
    .select("*")
    .eq("mese", mese)
    .eq("anno", anno);

  const paymentOf = (id: string) => payments?.find((p) => p.fixed_expense_id === id);

  const ricorrenti = (expenses ?? []).filter((e) => e.tipo === "ricorrente");
  const aScadenza = (expenses ?? []).filter((e) => e.tipo === "a_scadenza");

  const totaleMensile = (expenses ?? []).reduce(
    (sum, e) => sum + importoEffettivo(Number(e.importo_mensile), paymentOf(e.id)),
    0
  );

  function Riga({ e }: { e: any }) {
    const payment = paymentOf(e.id);
    const stato = payment?.stato ?? "da_pagare";
    const importoUsato = importoEffettivo(Number(e.importo_mensile), payment);
    const escluso = stato === "escluso";

    return (
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ fontSize: 14 }}>
            {e.nome}
            {e.giorno_scadenza && !e.numero_rate_totali && (
              <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                {" "}
                · scadenza il {e.giorno_scadenza}
              </span>
            )}
          </div>
          <span
            className="tabular"
            style={{ color: escluso ? "var(--ink-soft)" : "var(--negative)" }}
          >
            {escluso ? (
              <span style={{ textDecoration: "line-through" }}>
                {formatEuro(e.importo_mensile)}
              </span>
            ) : (
              formatEuro(importoUsato)
            )}
          </span>
        </div>

        {e.numero_rate_totali && !escluso && (
          <div style={{ marginBottom: 8 }}>
            <ProgressBar
              done={Math.min(
                e.data_inizio ? rateVersate(e.data_inizio, mese, anno) : 0,
                e.numero_rate_totali
              )}
              total={e.numero_rate_totali}
            />
          </div>
        )}

        <form
          action={updateFixedExpensePayment.bind(null, e.id, mese, anno)}
          style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}
        >
          <select name="stato" defaultValue={stato} style={{ ...inputStyle, flex: "1 1 140px" }}>
            <option value="da_pagare">Da pagare</option>
            <option value="pagato">Pagato</option>
            <option value="escluso">Escludi questo mese</option>
          </select>
          <input
            name="importo_effettivo"
            type="number"
            step="0.01"
            placeholder={`Importo (default ${e.importo_mensile})`}
            defaultValue={payment?.importo_effettivo ?? ""}
            style={{ ...inputStyle, flex: "1 1 160px" }}
          />
          <button type="submit" style={smallBtnStyle}>
            Aggiorna {"" + mese}/{anno}
          </button>
        </form>
      </div>
    );
  }

  return (
    <main style={{ padding: 32, maxWidth: 640, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, marginBottom: 24 }}>Spese fisse</h1>
      <MonthNav mese={mese} anno={anno} />

      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>
          Totale mensile impegnato ({mese}/{anno})
        </div>
        <div className="tabular negative" style={{ fontSize: 28, fontWeight: 600 }}>
          {formatEuro(totaleMensile)}
        </div>
      </div>

      <h2 style={{ fontSize: 15, marginTop: 32, marginBottom: 12 }}>A scadenza (finanziamenti)</h2>
      <div style={{ display: "grid", gap: 8, marginBottom: 24 }}>
        {aScadenza.map((e) => (
          <Riga key={e.id} e={e} />
        ))}
        {aScadenza.length === 0 && (
          <p style={{ fontSize: 14, color: "var(--ink-soft)" }}>Nessun finanziamento attivo.</p>
        )}
      </div>

      <h2 style={{ fontSize: 15, marginTop: 32, marginBottom: 12 }}>Ricorrenti (abbonamenti)</h2>
      <div style={{ display: "grid", gap: 8, marginBottom: 24 }}>
        {ricorrenti.map((e) => (
          <Riga key={e.id} e={e} />
        ))}
        {ricorrenti.length === 0 && (
          <p style={{ fontSize: 14, color: "var(--ink-soft)" }}>Nessun abbonamento attivo.</p>
        )}
      </div>

      <h2 style={{ fontSize: 15, marginTop: 32, marginBottom: 12 }}>Aggiungi spesa fissa</h2>
      <form action={addFixedExpense} className="card" style={{ padding: 20 }}>
        <div style={{ display: "grid", gap: 10 }}>
          <input name="nome" placeholder="Nome (es. Rata macchina)" required style={inputStyle} />
          <input
            name="importo_mensile"
            type="number"
            step="0.01"
            placeholder="Importo mensile"
            required
            style={inputStyle}
          />
          <select name="tipo" required style={inputStyle} defaultValue="ricorrente">
            <option value="ricorrente">Ricorrente (senza fine, es. abbonamento)</option>
            <option value="a_scadenza">A scadenza (es. finanziamento)</option>
          </select>
          <input
            name="giorno_scadenza"
            type="number"
            min="1"
            max="31"
            placeholder="Giorno di addebito nel mese (1-31)"
            style={inputStyle}
          />
          <input
            name="data_inizio"
            type="date"
            placeholder="Data prima rata (solo se a scadenza)"
            style={inputStyle}
          />
          <input
            name="numero_rate_totali"
            type="number"
            min="1"
            placeholder="Numero rate totali (solo se a scadenza)"
            style={inputStyle}
          />
          <button type="submit" style={btnStyle}>
            Aggiungi
          </button>
        </div>
      </form>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  border: "1px solid var(--line)",
  borderRadius: 12,
  fontSize: 14,
  fontFamily: "var(--font-ui)",
};

const btnStyle: React.CSSProperties = {
  padding: "10px 12px",
  background: "var(--ink)",
  color: "var(--paper)",
  border: "none",
  borderRadius: 12,
  fontSize: 14,
  cursor: "pointer",
};

const smallBtnStyle: React.CSSProperties = {
  padding: "8px 12px",
  background: "var(--ink)",
  color: "var(--paper)",
  border: "none",
  borderRadius: 12,
  fontSize: 13,
  cursor: "pointer",
};
