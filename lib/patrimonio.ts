import { importoEffettivo, monthRange, parseLocalDate } from "@/lib/date";

export async function calcolaPatrimonio(supabase: any) {
  const oggi = new Date();
  const meseCorrente = oggi.getMonth() + 1;
  const annoCorrente = oggi.getFullYear();

  const { data: saldoRows } = await supabase
    .from("saldo_iniziale")
    .select("*")
    .order("data", { ascending: false })
    .limit(1);
  const saldo = saldoRows?.[0];
  const baseData = saldo?.data ?? "1900-01-01";
  const baseLiquiditaSpendibile = saldo ? Number(saldo.liquidita_spendibile) : 0;
  const baseSaldoBuoni = saldo ? Number(saldo.saldo_buoni_pasto) : 0;
  const baseLiquiditaConBuoni = baseLiquiditaSpendibile + baseSaldoBuoni;

  const [
    { data: incomes },
    { data: fixedExpenses },
    { data: payments },
    { data: variableTx },
    { data: investments },
  ] = await Promise.all([
    supabase.from("incomes").select("fonte, importo, data").gt("data", baseData),
    supabase.from("fixed_expenses").select("id, importo_mensile"),
    supabase
      .from("fixed_expense_payments")
      .select("fixed_expense_id, mese, anno, stato, importo_effettivo"),
    supabase.from("variable_transactions").select("importo, metodo, data").gt("data", baseData),
    supabase.from("investments").select("importo"),
  ]);

  // Contano solo i mesi già trascorsi (fino a oggi incluso) e successivi alla
  // data del saldo di partenza: i mesi futuri sono solo segnaposto, i mesi
  // precedenti al saldo iniziale sono già "dentro" quel numero.
  const dataBase = parseLocalDate(baseData);
  const paymentsRilevanti = (payments ?? []).filter((p: any) => {
    const dataPagamento = new Date(p.anno, p.mese - 1, 1);
    const nelPassatoOOggi =
      p.anno < annoCorrente || (p.anno === annoCorrente && p.mese <= meseCorrente);
    return dataPagamento > dataBase && nelPassatoOOggi;
  });

  const totaleEntrate = (incomes ?? []).reduce((s: number, i: any) => s + Number(i.importo), 0);
  const totaleEntrateBuoni = (incomes ?? [])
    .filter((i: any) => String(i.fonte).toLowerCase().includes("buon"))
    .reduce((s: number, i: any) => s + Number(i.importo), 0);

  const totaleSpeseFisse = (fixedExpenses ?? []).reduce((sum: number, f: any) => {
    const relativi = paymentsRilevanti.filter((p: any) => p.fixed_expense_id === f.id);
    const speso = relativi.reduce(
      (s: number, p: any) => s + importoEffettivo(Number(f.importo_mensile), p),
      0
    );
    return sum + speso;
  }, 0);

  const totaleSpeseVariabili = (variableTx ?? []).reduce(
    (s: number, t: any) => s + Number(t.importo),
    0
  );
  const totaleSpeseVariabiliBuoni = (variableTx ?? [])
    .filter((t: any) => t.metodo === "buono_pasto")
    .reduce((s: number, t: any) => s + Number(t.importo), 0);

  const totaleInvestito = (investments ?? []).reduce((s: number, i: any) => s + Number(i.importo), 0);

  const liquiditaConBuoni =
    baseLiquiditaConBuoni + totaleEntrate - totaleSpeseFisse - totaleSpeseVariabili;
  const saldoBuoniPasto = baseSaldoBuoni + totaleEntrateBuoni - totaleSpeseVariabiliBuoni;
  const liquiditaSpendibile = liquiditaConBuoni - saldoBuoniPasto;
  const patrimonioTotale = liquiditaConBuoni + totaleInvestito;

  return {
    liquiditaConBuoni,
    liquiditaSpendibile,
    saldoBuoniPasto,
    totaleInvestito,
    patrimonioTotale,
    saldoImpostato: !!saldo,
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

// Riepilogo di un periodo arbitrario: le spese fisse sono sempre "previste"
// (anche nei mesi futuri, salvo modifiche/esclusioni), mentre entrate e
// spese variabili contano solo se effettivamente registrate.
export async function riepilogoPeriodo(supabase: any, start: string, end: string) {
  const mesi = mesiNelPeriodo(start, end);

  const [{ data: incomes }, { data: variableTx }, fixedPerMese] = await Promise.all([
    supabase.from("incomes").select("importo").gte("data", start).lt("data", end),
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

export async function breakdownVariabiliNelPeriodo(supabase: any, start: string, end: string) {
  const { data: variableTx } = await supabase
    .from("variable_transactions")
    .select("importo, variable_categories(nome)")
    .gte("data", start)
    .lt("data", end);

  const totali = new Map<string, number>();
  (variableTx ?? []).forEach((t: any) => {
    const nome = t.variable_categories?.nome ?? "Senza categoria";
    totali.set(nome, (totali.get(nome) ?? 0) + Number(t.importo));
  });

  return Array.from(totali.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

// Proietta la liquidità spendibile in avanti fino al mese/anno indicati,
// sottraendo sempre le spese fisse note di ciascun mese intermedio, e
// sommando/sottraendo entrate e spese variabili SOLO se effettivamente
// registrate per quel mese (nessuna media stimata: un mese futuro senza
// dati pesa solo per le spese fisse, finché non ci registri qualcosa).
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

  let liquiditaConBuoni = patrimonio.liquiditaConBuoni;
  let cursore = new Date(annoCorrente, meseCorrente - 1, 1);
  const fine = new Date(annoTarget, meseTarget - 1, 1);

  while (cursore < fine) {
    cursore = new Date(cursore.getFullYear(), cursore.getMonth() + 1, 1);
    const m = cursore.getMonth() + 1;
    const a = cursore.getFullYear();
    const { start, end } = monthRange(m, a);

    const [{ data: entrateDelMese }, { data: variabiliDelMese }, fisseDelMese] = await Promise.all([
      supabase.from("incomes").select("importo").gte("data", start).lt("data", end),
      supabase.from("variable_transactions").select("importo").gte("data", start).lt("data", end),
      totaleFisseDelMese(supabase, m, a),
    ]);

    const totaleEntrateMese = (entrateDelMese ?? []).reduce((s: number, i: any) => s + Number(i.importo), 0);
    const totaleVariabiliMese = (variabiliDelMese ?? []).reduce((s: number, t: any) => s + Number(t.importo), 0);

    liquiditaConBuoni = liquiditaConBuoni + totaleEntrateMese - fisseDelMese - totaleVariabiliMese;
  }

  const liquiditaSpendibile = liquiditaConBuoni - patrimonio.saldoBuoniPasto;
  const patrimonioTotale = liquiditaConBuoni + patrimonio.totaleInvestito;

  return { liquiditaSpendibile, liquiditaConBuoni, patrimonioTotale, proiettato: true };
}
