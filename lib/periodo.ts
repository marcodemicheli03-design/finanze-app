import { MESI, formatLocalISO, parseLocalDate } from "@/lib/date";

export type Preset = "mese" | "trimestre" | "anno" | "sempre" | "custom";

export interface PeriodoParams {
  p?: string;
  ref?: string;
  da?: string;
  a?: string;
}

const iso = formatLocalISO;

export function getPeriodo(params: PeriodoParams) {
  const preset = (params.p as Preset) || "mese";
  const ref = params.ref ? parseLocalDate(params.ref) : new Date();

  if (preset === "custom" && params.da && params.a) {
    const fine = parseLocalDate(params.a);
    fine.setDate(fine.getDate() + 1);
    return {
      preset,
      ref: iso(ref),
      start: params.da,
      end: iso(fine),
      label: `${parseLocalDate(params.da).toLocaleDateString("it-IT")} – ${parseLocalDate(
        params.a
      ).toLocaleDateString("it-IT")}`,
    };
  }

  if (preset === "sempre") {
    const oggi = new Date();
    const domani = new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate() + 1);
    return { preset, ref: iso(ref), start: "2000-01-01", end: iso(domani), label: "Da sempre" };
  }

  if (preset === "trimestre") {
    const qStartMonth = Math.floor(ref.getMonth() / 3) * 3;
    const start = new Date(ref.getFullYear(), qStartMonth, 1);
    const end = new Date(ref.getFullYear(), qStartMonth + 3, 1);
    const q = qStartMonth / 3 + 1;
    return { preset, ref: iso(ref), start: iso(start), end: iso(end), label: `Q${q} ${ref.getFullYear()}` };
  }

  if (preset === "anno") {
    const start = new Date(ref.getFullYear(), 0, 1);
    const end = new Date(ref.getFullYear() + 1, 0, 1);
    return { preset, ref: iso(ref), start: iso(start), end: iso(end), label: `${ref.getFullYear()}` };
  }

  // mese (default)
  const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 1);
  return {
    preset: "mese" as Preset,
    ref: iso(ref),
    start: iso(start),
    end: iso(end),
    label: `${MESI[ref.getMonth()]} ${ref.getFullYear()}`,
  };
}

export function shiftRef(preset: Preset, refStr: string, dir: 1 | -1) {
  const ref = parseLocalDate(refStr);
  if (preset === "trimestre") {
    return iso(new Date(ref.getFullYear(), ref.getMonth() + 3 * dir, 1));
  }
  if (preset === "anno") {
    return iso(new Date(ref.getFullYear() + dir, ref.getMonth(), 1));
  }
  return iso(new Date(ref.getFullYear(), ref.getMonth() + dir, 1));
}
