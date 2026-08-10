import { importoEffettivo, monthRange, parseLocalDate, formatLocalISO, MESI } from "@/lib/date";

async function getSaldoIniziale(supabase: any) {
  const { data: saldoRows } = await supabase
    .from("saldo_iniziale")
    .select("*")
    .order("data", { ascending: false })
    .limit(1);
  const saldo = saldoRows?.[0];
  return {
    data: saldo?.data ?? "1900-01-01",
    liquiditaSpendibile: saldo ? Number(saldo.liquidita_spendibile) : 0,
    saldoBuoni: saldo ? Number(saldo.saldo_buoni_pasto) : 0,
    impostato: !!saldo,
  };
}

export async function totaleFisseDelMese(supabase: any, mese: number, anno: number) {
  const [{ data: fixedExpenses }, { data: payments }] = await Promise.all([
    supabase.from("fixed_expenses").select("id, importo_mensile").eq("attiva", true),
    supabase
      .from("fixed_expense_payments")
      .select("fixed_expense_id, stato, importo_effettivo")
      .eq("mese", mese)
      .eq("anno", anno),
  ]);

  return (fixedExpenses ?? []).reduce(
    (sum: number, f: any) =>
      sum +
      importoEffettivo(
        Number(f.importo_mensile),
        (payments ?? []).find((p: any) => p.fixed_expense_id === f.id)
      ),
    0
  );
}

function mesiNelPeriodo(start: string, end: string) {
  const mesi: { mese: number; anno: number }[] = [];
  let cursore = new Date(parseLocalDate(start).getFullYear(), parseLocalDate(start).getMonth(), 1);
  const fine = parseLocalDate(end);
  let guardia = 0;
  while (cursore < fine && guardia < 300) {
    mesi.push({ mese: cursore.getMonth() + 1, anno: cursore.getFullYear() });
    cursore = new Date(cursore.getFullYear(), cursore.getMonth() + 1, 1);
    guardia++;
  }
  return mesi;
}

// ============ PATRIMONIO (le 4 cifre della sezione Patrimonio) ============
// - liquiditaSenzaBuoni: conto "normale" (entrate non-buono - fisse - variabili non-buono)
// - saldoBuoniPasto: ledger separato (entrate buoni - uscite buoni)
// - liquiditaConBuoni: somma dei due
// - investito: solo investimenti
// - patrimonioTotale: liquiditaConBuoni + investito
export async function calcolaPatrimonio(supabase: any) {
  const oggi = new Date();
  const meseCorrente = oggi.getMonth() + 1;
  const annoCorrente = oggi.getFullYear();
  const base = await getSaldoIniziale(supabase);

  const [
    { data: incomes },
    { data: variableTx },
    { data: investments },
  ] = await Promise.all([
    supabase.from("incomes").select("fonte, importo, data").gt("data", base.data),
    supabase.from("variable_transactions").select("importo, data").gt("data", base.data),
    supabase.from("investments").select("importo"),
  ]);

  const dataBase = parseLocalDate(base.data);

  const meseInizio = new Date(dataBase.getFullYear(), dataBase.getMonth() + 1, 1);
  const meseFineEsclusa = new Date(annoCorrente, meseCorrente, 1);
  const mesiDaContare: { mese: number; anno: number }[] = [];
  let cursoreFisse = new Date(meseInizio);
  let guardiaFisse = 0;
  while (cursoreFisse < meseFineEsclusa && guardiaFisse < 300) {
    mesiDaContare.push({ mese: cursoreFisse.getMonth() + 1, anno: cursoreFisse.getFullYear() });
    cursoreFisse = new Date(cursoreFisse.getFullYear(), cursoreFisse.getMonth() + 1, 1);
    guardiaFisse++;
  }
  const totaleSpeseFisse = (
    await Promise.all(mesiDaContare.map((m) => totaleFisseDelMese(supabase, m.mese, m.anno)))
  ).reduce((s, v) => s + v, 0);

  const entrateNonBuono = (incomes ?? []).filter((i: any) => i.fonte !== "Buoni pasto");
  const totaleEntrateNonBuono = entrateNonBuono.reduce((s: number, i: any) => s + Number(i.importo), 0);

  const totaleSpeseVariabili = (variableTx ?? []).reduce((s: number, t: any) => s + Number(t.importo), 0);
  const totaleInvestito = (investments ?? []).reduce((s: number, i: any) => s + Number(i.importo), 0);

  const andamentoBuoni = await andamentoMensile(supabase, "buoni");
  const saldoBuoniPasto = andamentoBuoni.length > 0 ? andamentoBuoni[0].cumulato : 0;

  const liquiditaSenzaBuoni =
    base.liquiditaSpendibile + totaleEntrateNonBuono - totaleSpeseFisse - totaleSpeseVariabili;
  const liquiditaConBuoni = liquiditaSenzaBuoni + saldoBuoniPasto;
  const patrimonioTotale = liquiditaConBuoni + totaleInvestito;

  return {
    liquiditaConBuoni,
    liquiditaSpendibile: liquiditaSenzaBuoni,
    saldoBuoniPasto,
    totaleInvestito,
    patrimonioTotale,
    saldoImpostato: base.impostato,
  };
}

// ============ Riepilogo periodo (Dashboard / recap) ============
export async function riepilogoPeriodo(supabase: any, start: string, end: string) {
  const mesi = mesiNelPeriodo(start, end);

  const [{ data: incomes }, { data: variableTx }, fixedPerMese] = await Promise.all([
    supabase.from("incomes").select("importo, fonte").gte("data", start).lt("data", end),
    supabase.from("variable_transactions").select("importo").gte("data", start).lt("data", end),
    Promise.all(mesi.map((m) => totaleFisseDelMese(supabase, m.mese, m.anno))),
  ]);

  const totaleEntrate = (incomes ?? []).reduce((s: number, i: any) => s + Number(i.importo), 0);
  const totaleVariabili = (variableTx ?? []).reduce((s: number, t: any) => s + Number(t.importo), 0);
  const totaleFisse = fixedPerMese.reduce((s: number, v: number) => s + v, 0);

  return {
    totaleEntrate,
    totaleFisse,
    totaleVariabili,
    risparmio: totaleEntrate - totaleFisse - totaleVariabili,
  };
}

export async function breakdownFisseNelPeriodo(supabase: any, start: string, end: string) {
  const mesi = mesiNelPeriodo(start, end);
  const { data: fixedExpenses } = await supabase
    .from("fixed_expenses")
    .select("id, nome, importo_mensile")
    .eq("attiva", true);
  const { data: paymentsRaw } = await supabase
    .from("fixed_expense_payments")
    .select("fixed_expense_id, mese, anno, stato, importo_effettivo");

  const totali = new Map<string, number>();
  for (const f of fixedExpenses ?? []) {
    let somma = 0;
    for (const m of mesi) {
      const payment = (paymentsRaw ?? []).find(
        (p: any) => p.fixed_expense_id === f.id && p.mese === m.mese && p.anno === m.anno
      );
      somma += importoEffettivo(Number(f.importo_mensile), payment);
    }
    if (somma > 0) totali.set(f.nome, (totali.get(f.nome) ?? 0) + somma);
  }
  return Array.from(totali.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

async function breakdownGenerico(supabase: any, table: string, catTable: string, catCol: string, start: string, end: string) {
  const { data } = await supabase
    .from(table)
    .select(`importo, ${catCol}(nome)`)
    .gte("data", start)
    .lt("data", end);
  const totali = new Map<string, number>();
  (data ?? []).forEach((t: any) => {
    const nome = t[catCol]?.nome ?? "Senza categoria";
    totali.set(nome, (totali.get(nome) ?? 0) + Number(t.importo));
  });
  return Array.from(totali.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export async function breakdownVariabiliNelPeriodo(supabase: any, start: string, end: string) {
  return breakdownGenerico(supabase, "variable_transactions", "variable_categories", "variable_categories", start, end);
}

export async function breakdownBuoniNelPeriodo(supabase: any, start: string, end: string) {
  return breakdownGenerico(supabase, "buono_transactions", "buono_categories", "buono_categories", start, end);
}

export async function breakdownEntrateNelPeriodo(supabase: any, start: string, end: string) {
  const { data } = await supabase.from("incomes").select("importo, fonte").gte("data", start).lt("data", end);
  const totali = new Map<string, number>();
  (data ?? []).forEach((i: any) => {
    totali.set(i.fonte, (totali.get(i.fonte) ?? 0) + Number(i.importo));
  });
  return Array.from(totali.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export async function breakdownInvestimentiNelPeriodo(supabase: any, start: string, end: string) {
  const { data } = await supabase.from("investments").select("importo, nome").gte("data", start).lt("data", end);
  const totali = new Map<string, number>();
  (data ?? []).forEach((i: any) => {
    totali.set(i.nome, (totali.get(i.nome) ?? 0) + Number(i.importo));
  });
  return Array.from(totali.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export async function recapAnni(supabase: any) {
  const oggi = new Date();
  const annoCorrente = oggi.getFullYear();

  const [{ data: incomes }, { data: variableTx }] = await Promise.all([
    supabase.from("incomes").select("data").order("data", { ascending: true }).limit(1),
    supabase.from("variable_transactions").select("data").order("data", { ascending: true }).limit(1),
  ]);

  const anniCandidati = [
    incomes?.[0]?.data ? parseLocalDate(incomes[0].data).getFullYear() : annoCorrente,
    variableTx?.[0]?.data ? parseLocalDate(variableTx[0].data).getFullYear() : annoCorrente,
  ];
  const annoMinimo = Math.min(annoCorrente, ...anniCandidati);
  const annoMassimo = annoCorrente + 1;

  const risultati = [];
  for (let anno = annoMinimo; anno <= annoMassimo; anno++) {
    const start = `${anno}-01-01`;
    const end = `${anno + 1}-01-01`;
    const r = await riepilogoPeriodo(supabase, start, end);
    risultati.push({ anno, ...r });
  }
  return risultati.reverse();
}

// ============ Proiezione ============
export async function proiettaLiquidita(supabase: any, meseTarget: number, annoTarget: number) {
  const patrimonio = await calcolaPatrimonio(supabase);
  const oggi = new Date();
  const meseCorrente = oggi.getMonth() + 1;
  const annoCorrente = oggi.getFullYear();

  const targetNelFuturo =
    annoTarget > annoCorrente || (annoTarget === annoCorrente && meseTarget > meseCorrente);

  if (!targetNelFuturo) {
    return {
      liquiditaSpendibile: patrimonio.liquiditaSpendibile,
      liquiditaConBuoni: patrimonio.liquiditaConBuoni,
      patrimonioTotale: patrimonio.patrimonioTotale,
      proiettato: false,
    };
  }

  let liquiditaSenzaBuoni = patrimonio.liquiditaSpendibile;
  let cursore = new Date(annoCorrente, meseCorrente - 1, 1);
  const fine = new Date(annoTarget, meseTarget - 1, 1);

  while (cursore < fine) {
    cursore = new Date(cursore.getFullYear(), cursore.getMonth() + 1, 1);
    const m = cursore.getMonth() + 1;
    const a = cursore.getFullYear();
    const { start, end } = monthRange(m, a);

    const [{ data: entrateDelMese }, { data: variabiliDelMese }, fisseDelMese] = await Promise.all([
      supabase.from("incomes").select("importo, fonte").gte("data", start).lt("data", end),
      supabase.from("variable_transactions").select("importo").gte("data", start).lt("data", end),
      totaleFisseDelMese(supabase, m, a),
    ]);

    const totaleEntrateMese = (entrateDelMese ?? [])
      .filter((i: any) => i.fonte !== "Buoni pasto")
      .reduce((s: number, i: any) => s + Number(i.importo), 0);
    const totaleVariabiliMese = (variabiliDelMese ?? []).reduce((s: number, t: any) => s + Number(t.importo), 0);

    liquiditaSenzaBuoni = liquiditaSenzaBuoni + totaleEntrateMese - fisseDelMese - totaleVariabiliMese;
  }

  const liquiditaConBuoni = liquiditaSenzaBuoni + patrimonio.saldoBuoniPasto;
  const patrimonioTotale = liquiditaConBuoni + patrimonio.totaleInvestito;

  return { liquiditaSpendibile: liquiditaSenzaBuoni, liquiditaConBuoni, patrimonioTotale, proiettato: true };
}

// ============ Andamento mensile (avanzato + cumulato) ============
// tipo 'variabili': avanzato(mese) = entrate non-buono - fisse - variabili non-buono
// tipo 'buoni': avanzato(mese) = entrate buoni - uscite buoni (nessuna fissa)
export async function andamentoMensile(supabase: any, tipo: "variabili" | "buoni") {
  const base = await getSaldoIniziale(supabase);
  const oggi = new Date();
  const dataBase = parseLocalDate(base.data);

  const primoMese = { mese: dataBase.getMonth() + 2 > 12 ? 1 : dataBase.getMonth() + 2, anno: dataBase.getMonth() + 2 > 12 ? dataBase.getFullYear() + 1 : dataBase.getFullYear() };
  // mesi dal mese successivo al saldo di partenza fino al mese corrente incluso
  const mesi: { mese: number; anno: number }[] = [];
  let cursore = new Date(dataBase.getFullYear(), dataBase.getMonth() + 1, 1);
  const fine = new Date(oggi.getFullYear(), oggi.getMonth() + 1, 1);
  let guardia = 0;
  while (cursore < fine && guardia < 300) {
    mesi.push({ mese: cursore.getMonth() + 1, anno: cursore.getFullYear() });
    cursore = new Date(cursore.getFullYear(), cursore.getMonth() + 1, 1);
    guardia++;
  }

  let cumulato = tipo === "variabili" ? base.liquiditaSpendibile : 0;
  let avanzatoPrecedente = 0;
  const risultati = [];

  for (const m of mesi) {
    const { start, end } = monthRange(m.mese, m.anno);
    if (tipo === "variabili") {
      const [{ data: entrate }, { data: variabili }, fisse] = await Promise.all([
        supabase.from("incomes").select("importo, fonte").gte("data", start).lt("data", end),
        supabase.from("variable_transactions").select("importo").gte("data", start).lt("data", end),
        totaleFisseDelMese(supabase, m.mese, m.anno),
      ]);
      const totEntrate = (entrate ?? [])
        .filter((i: any) => i.fonte !== "Buoni pasto")
        .reduce((s: number, i: any) => s + Number(i.importo), 0);
      const totVariabili = (variabili ?? []).reduce((s: number, t: any) => s + Number(t.importo), 0);
      const avanzato = totEntrate - fisse - totVariabili;
      cumulato += avanzato;
      risultati.push({ mese: m.mese, anno: m.anno, entrate: totEntrate, fisse, uscite: totVariabili, avanzato, cumulato });
    } else {
      const [{ data: entrate }, { data: buoni }] = await Promise.all([
        supabase.from("incomes").select("importo, fonte").gte("data", start).lt("data", end),
        supabase.from("buono_transactions").select("importo").gte("data", start).lt("data", end),
      ]);
      const totEntrate = (entrate ?? [])
        .filter((i: any) => i.fonte === "Buoni pasto")
        .reduce((s: number, i: any) => s + Number(i.importo), 0);
      const totBuoni = (buoni ?? []).reduce((s: number, t: any) => s + Number(t.importo), 0);
      const avanzato = totEntrate - totBuoni;
      // Cumulato = avanzato del mese precedente + avanzato del mese corrente
      // (non una somma progressiva di tutta la storia)
      cumulato = avanzatoPrecedente + avanzato;
      avanzatoPrecedente = avanzato;
      risultati.push({ mese: m.mese, anno: m.anno, entrate: totEntrate, uscite: totBuoni, avanzato, cumulato });
    }
  }

  return risultati.reverse();
}
