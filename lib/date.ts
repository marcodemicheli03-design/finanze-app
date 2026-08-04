export const MESI = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

export function importoEffettivo(
  importoBase: number,
  payment: { stato: string; importo_effettivo: number | null } | undefined
) {
  if (!payment) return importoBase;
  if (payment.stato === "escluso") return 0;
  return payment.importo_effettivo ?? importoBase;
}

export function formatEuro(value: number | null | undefined) {
  const n = value ?? 0;
  return n.toLocaleString("it-IT", { style: "currency", currency: "EUR" });
}

export function currentMonthYear() {
  const now = new Date();
  return { mese: now.getMonth() + 1, anno: now.getFullYear() };
}

// IMPORTANTE: mai usare Date.toISOString() per formattare una data "locale"
// (es. mezzanotte del giorno 1) in stringa YYYY-MM-DD: toISOString() converte
// in UTC, e in fusi avanti rispetto a UTC (come l'Italia) questo fa "perdere
// un giorno" proprio sui primi del mese, causando bug di un mese intero nei
// calcoli. Queste due funzioni lavorano sempre in orario locale.
export function formatLocalISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseLocalDate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayLocalISO() {
  return formatLocalISO(new Date());
}

export function monthRange(mese: number, anno: number) {
  const start = new Date(anno, mese - 1, 1);
  const end = new Date(anno, mese, 1);
  return { start: formatLocalISO(start), end: formatLocalISO(end) };
}
