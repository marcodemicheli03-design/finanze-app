"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { todayLocalISO } from "@/lib/date";

// ---- Entrate ----

export async function addIncome(formData: FormData) {
  const supabase = createClient();
  await supabase.from("incomes").insert({
    fonte: String(formData.get("fonte")),
    data: String(formData.get("data")),
    importo: Number(formData.get("importo")),
    note: formData.get("note") ? String(formData.get("note")) : null,
  });
  revalidatePath("/entrate");
  revalidatePath("/");
}

export async function deleteIncome(id: string) {
  const supabase = createClient();
  await supabase.from("incomes").delete().eq("id", id);
  revalidatePath("/entrate");
  revalidatePath("/");
}

// ---- Spese fisse ----

export async function addFixedExpense(formData: FormData) {
  const supabase = createClient();
  const tipo = String(formData.get("tipo"));
  await supabase.from("fixed_expenses").insert({
    nome: String(formData.get("nome")),
    importo_mensile: Number(formData.get("importo_mensile")),
    giorno_scadenza: formData.get("giorno_scadenza")
      ? Number(formData.get("giorno_scadenza"))
      : null,
    tipo,
    data_inizio: tipo === "a_scadenza" ? String(formData.get("data_inizio")) : null,
    numero_rate_totali:
      tipo === "a_scadenza" ? Number(formData.get("numero_rate_totali")) : null,
  });
  revalidatePath("/spese-fisse");
  revalidatePath("/");
}

export async function updateFixedExpensePayment(
  fixedExpenseId: string,
  mese: number,
  anno: number,
  formData: FormData
) {
  const supabase = createClient();
  const stato = String(formData.get("stato"));
  const importoRaw = formData.get("importo_effettivo");
  const importoEffettivo =
    importoRaw && String(importoRaw).trim() !== "" ? Number(importoRaw) : null;

  await supabase.from("fixed_expense_payments").upsert(
    {
      fixed_expense_id: fixedExpenseId,
      mese,
      anno,
      stato,
      importo_effettivo: stato === "escluso" ? null : importoEffettivo,
      data_pagamento: stato === "pagato" ? todayLocalISO() : null,
    },
    { onConflict: "fixed_expense_id,mese,anno" }
  );
  revalidatePath("/spese-fisse");
  revalidatePath("/");
}

// ---- Spese variabili ----

export async function addVariableCategory(formData: FormData) {
  const supabase = createClient();
  await supabase.from("variable_categories").insert({
    nome: String(formData.get("nome")),
  });
  revalidatePath("/spese-variabili");
}

export async function addVariableTransaction(formData: FormData) {
  const supabase = createClient();
  await supabase.from("variable_transactions").insert({
    category_id: String(formData.get("category_id")),
    data: String(formData.get("data")),
    importo: Number(formData.get("importo")),
    metodo: String(formData.get("metodo")),
    note: formData.get("note") ? String(formData.get("note")) : null,
  });
  revalidatePath("/spese-variabili");
  revalidatePath("/");
}

export async function deleteVariableTransaction(id: string) {
  const supabase = createClient();
  await supabase.from("variable_transactions").delete().eq("id", id);
  revalidatePath("/spese-variabili");
  revalidatePath("/");
}

// ---- Investimenti ----

export async function addInvestment(formData: FormData) {
  const supabase = createClient();
  await supabase.from("investments").insert({
    nome: String(formData.get("nome")),
    tipo: String(formData.get("tipo")),
    data: String(formData.get("data")),
    importo: Number(formData.get("importo")),
    quote: formData.get("quote") ? Number(formData.get("quote")) : null,
  });
  revalidatePath("/investimenti");
  revalidatePath("/");
}

export async function deleteInvestment(id: string) {
  const supabase = createClient();
  await supabase.from("investments").delete().eq("id", id);
  revalidatePath("/investimenti");
  revalidatePath("/");
}

// ---- Obiettivi ----

export async function addGoal(formData: FormData) {
  const supabase = createClient();
  await supabase.from("goals").insert({
    nome: String(formData.get("nome")),
    importo_target: Number(formData.get("importo_target")),
    data_target: formData.get("data_target") ? String(formData.get("data_target")) : null,
    importo_attuale: formData.get("importo_attuale") ? Number(formData.get("importo_attuale")) : 0,
  });
  revalidatePath("/obiettivi");
}

export async function updateGoalAmount(id: string, formData: FormData) {
  const supabase = createClient();
  await supabase
    .from("goals")
    .update({ importo_attuale: Number(formData.get("importo_attuale")) })
    .eq("id", id);
  revalidatePath("/obiettivi");
}

export async function deleteGoal(id: string) {
  const supabase = createClient();
  await supabase.from("goals").delete().eq("id", id);
  revalidatePath("/obiettivi");
}

// ---- Saldo iniziale ----

export async function setSaldoIniziale(formData: FormData) {
  const supabase = createClient();
  await supabase.from("saldo_iniziale").insert({
    data: String(formData.get("data")),
    liquidita_spendibile: Number(formData.get("liquidita_spendibile")),
    saldo_buoni_pasto: formData.get("saldo_buoni_pasto")
      ? Number(formData.get("saldo_buoni_pasto"))
      : 0,
  });
  revalidatePath("/");
  revalidatePath("/proiezioni");
}
