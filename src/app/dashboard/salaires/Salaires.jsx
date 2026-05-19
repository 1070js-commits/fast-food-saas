"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  endOfMonth,
  endOfWeek,
  format,
  parse,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

function capitalize(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDateIso(d) {
  return format(d, "yyyy-MM-dd");
}

function monthBounds(monthValue) {
  const base = parse(`${monthValue}-01`, "yyyy-MM-dd", new Date());
  return {
    dateDebut: formatDateIso(startOfMonth(base)),
    dateFin: formatDateIso(endOfMonth(base)),
  };
}

function defaultWeekDates() {
  const now = new Date();
  return {
    dateDebut: formatDateIso(startOfWeek(now, { weekStartsOn: 1 })),
    dateFin: formatDateIso(endOfWeek(now, { weekStartsOn: 1 })),
  };
}

function formatPeriodeLabel(row) {
  const debut = row.date_debut ? new Date(`${row.date_debut}T12:00:00`) : null;
  const fin = row.date_fin ? new Date(`${row.date_fin}T12:00:00`) : null;
  if (!debut || !fin) return "—";

  if (row.type_periode === "hebdomadaire") {
    return `${format(debut, "d MMM yyyy", { locale: fr })} → ${format(fin, "d MMM yyyy", { locale: fr })}`;
  }
  return capitalize(format(debut, "MMMM yyyy", { locale: fr }));
}

function currentMonthValue() {
  return format(new Date(), "yyyy-MM");
}

/**
 * @param {{
 *   businessId: string;
 *   employes?: { id: string; nom: string; poste?: string | null }[];
 *   initialSalaires?: {
 *     id: string;
 *     employe_id: string;
 *     montant: number;
 *     type_periode: string;
 *     date_debut: string;
 *     date_fin: string;
 *     notes?: string | null;
 *     created_at?: string;
 *   }[];
 * }} props
 */
export default function Salaires({
  businessId,
  employes = [],
  initialSalaires = [],
}) {
  const router = useRouter();
  const supabase = createClient();

  const weekDefaults = defaultWeekDates();

  const [type_periode, setTypePeriode] = useState("mensuel");
  const [monthValue, setMonthValue] = useState(currentMonthValue);
  const [dateDebut, setDateDebut] = useState(weekDefaults.dateDebut);
  const [dateFin, setDateFin] = useState(weekDefaults.dateFin);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const employeId = String(formData.get("employe_id") ?? "");
    const montant = Number(formData.get("montant"));
    const notes = String(formData.get("notes") ?? "").trim() || null;
    const typePeriodeSelection = String(formData.get("type_periode") ?? type_periode);

    if (!employeId) {
      toast.error("Sélectionnez un employé");
      return;
    }
    if (!montant || montant <= 0) {
      toast.error("Montant invalide");
      return;
    }

    let date_debut;
    let date_fin;

    if (typePeriodeSelection === "hebdomadaire") {
      date_debut = String(formData.get("date_debut") ?? dateDebut);
      date_fin = String(formData.get("date_fin") ?? dateFin);
      if (!date_debut || !date_fin) {
        toast.error("Indiquez les dates de début et de fin");
        return;
      }
      if (date_fin < date_debut) {
        toast.error("La date de fin doit être après la date de début");
        return;
      }
    } else {
      const mois = String(formData.get("periode_mois") ?? monthValue);
      const bounds = monthBounds(mois);
      date_debut = bounds.dateDebut;
      date_fin = bounds.dateFin;
    }

    const payload = {
      business_id: businessId,
      employe_id: employeId,
      montant,
      type_periode: typePeriodeSelection,
      date_debut,
      date_fin,
      notes,
    };

    console.log("[Salaires] state avant envoi:", {
      type_periode: typePeriodeSelection,
      type_periode_state: type_periode,
      date_debut,
      date_fin,
      monthValue,
      dateDebut,
      dateFin,
    });
    console.log("[Salaires] payload Supabase:", payload);

    setBusy(true);
    const { error } = await supabase.from("salaires").insert(payload);
    setBusy(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Salaire enregistré");
    router.refresh();
  };

  const employeMap = useMemo(
    () => new Map(employes.map((e) => [e.id, e.nom])),
    [employes]
  );

  return (
    <div className="space-y-8">
      <section className="rounded-lg border bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold">Nouveau paiement</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Employé
            </label>
            <select
              name="employe_id"
              required
              className="w-full rounded border px-3 py-2"
              defaultValue=""
            >
              <option value="" disabled>
                Choisir un employé
              </option>
              {employes.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nom}
                  {e.poste ? ` — ${e.poste}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Montant (€)
            </label>
            <input
              name="montant"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              className="w-full rounded border px-3 py-2"
            />
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label
                htmlFor="type_periode"
                className="text-sm font-medium text-gray-700"
              >
                Type de période
              </label>
              <select
                id="type_periode"
                name="type_periode"
                value={type_periode}
                onChange={(e) => setTypePeriode(e.target.value)}
                className="w-full max-w-xs rounded border px-3 py-2"
              >
                <option value="mensuel">Mensuel</option>
                <option value="hebdomadaire">Hebdomadaire</option>
              </select>
            </div>

            {type_periode === "mensuel" ? (
              <div className="space-y-1">
                <label
                  htmlFor="periode_mois"
                  className="text-sm font-medium text-gray-700"
                >
                  Mois / année
                </label>
                <input
                  id="periode_mois"
                  name="periode_mois"
                  type="month"
                  value={monthValue}
                  onChange={(e) => setMonthValue(e.target.value)}
                  className="w-full max-w-xs rounded border px-3 py-2"
                />
                <p className="text-xs text-gray-500">
                  Période :{" "}
                  {capitalize(
                    format(
                      parse(`${monthValue}-01`, "yyyy-MM-dd", new Date()),
                      "MMMM yyyy",
                      { locale: fr }
                    )
                  )}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                <div className="space-y-1">
                  <label
                    htmlFor="date_debut"
                    className="text-sm font-medium text-gray-700"
                  >
                    Date de début
                  </label>
                  <input
                    id="date_debut"
                    name="date_debut"
                    type="date"
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                    required
                    className="w-full rounded border px-3 py-2"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="date_fin"
                    className="text-sm font-medium text-gray-700"
                  >
                    Date de fin
                  </label>
                  <input
                    id="date_fin"
                    name="date_fin"
                    type="date"
                    value={dateFin}
                    min={dateDebut}
                    onChange={(e) => setDateFin(e.target.value)}
                    required
                    className="w-full rounded border px-3 py-2"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Notes (optionnel)
            </label>
            <textarea
              name="notes"
              rows={2}
              className="w-full rounded border px-3 py-2"
              placeholder="Prime, heures sup…"
            />
          </div>

          <button
            type="submit"
            disabled={busy || employes.length === 0}
            className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {busy ? "Enregistrement…" : "Enregistrer le salaire"}
          </button>
        </form>
      </section>

      <section className="rounded-lg border bg-white overflow-hidden">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Historique</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Type de période et dates associées
          </p>
        </div>
        {initialSalaires.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-500">
            Aucun salaire enregistré.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Employé</th>
                  <th className="px-4 py-3 font-medium">Type de période</th>
                  <th className="px-4 py-3 font-medium">Période</th>
                  <th className="px-4 py-3 font-medium text-right">Montant</th>
                  <th className="px-4 py-3 font-medium">Enregistré le</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {initialSalaires.map((row) => {
                  const isMensuel = row.type_periode === "mensuel";
                  return (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">
                        {employeMap.get(row.employe_id) ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isMensuel
                              ? "bg-blue-100 text-blue-800"
                              : "bg-violet-100 text-violet-800"
                          }`}
                        >
                          {isMensuel ? "Mensuel" : "Hebdomadaire"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {formatPeriodeLabel(row)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {Number(row.montant).toFixed(2)} €
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {row.created_at
                          ? format(new Date(row.created_at), "d MMM yyyy", {
                              locale: fr,
                            })
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

