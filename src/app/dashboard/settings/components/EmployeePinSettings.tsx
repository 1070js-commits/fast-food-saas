"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export function EmployeePinSettings() {
  const [managerPin, setManagerPin] = useState("");
  const [employeePin, setEmployeePin] = useState("");
  const [hasManagerPin, setHasManagerPin] = useState(false);
  const [hasEmployeePin, setHasEmployeePin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<"manager" | "employee" | null>(null);

  useEffect(() => {
    fetch("/api/employe/pin")
      .then((res) => res.json())
      .then((data) => {
        setHasManagerPin(Boolean(data.hasManagerPin));
        setHasEmployeePin(Boolean(data.hasEmployeePin));
      })
      .catch(() => toast.error("Impossible de charger les PIN"))
      .finally(() => setLoading(false));
  }, []);

  const save = async (type: "manager" | "employee") => {
    const pin = type === "manager" ? managerPin : employeePin;
    if (!/^\d{4}$/.test(pin)) {
      toast.error("Le code PIN doit contenir exactement 4 chiffres.");
      return;
    }
    setSaving(type);
    try {
      const res = await fetch("/api/employe/pin", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pin, type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      if (type === "manager") {
        setHasManagerPin(true);
        setManagerPin("");
      } else {
        setHasEmployeePin(true);
        setEmployeePin("");
      }
      toast.success(
        type === "manager" ? "PIN gérant enregistré" : "PIN employé enregistré"
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(null);
    }
  };

  return (
    <section className="rounded-2xl border border-gray-800 bg-[#161922] p-6 space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-white">Accès employés</h2>
        <p className="mt-1 text-sm text-gray-400">
          Codes PIN pour l&apos;écran d&apos;accueil — profils Gérant et Employé
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Chargement…</p>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2">
          <PinField
            label="PIN Gérant"
            hint="Accès complet au dashboard"
            hasPin={hasManagerPin}
            pin={managerPin}
            onChange={setManagerPin}
            onSave={() => save("manager")}
            saving={saving === "manager"}
          />
          <PinField
            label="PIN Employé"
            hint="Caisse, cuisine et stock uniquement"
            hasPin={hasEmployeePin}
            pin={employeePin}
            onChange={setEmployeePin}
            onSave={() => save("employee")}
            saving={saving === "employee"}
          />
        </div>
      )}
    </section>
  );
}

function PinField({
  label,
  hint,
  hasPin,
  pin,
  onChange,
  onSave,
  saving,
}: {
  label: string;
  hint: string;
  hasPin: boolean;
  pin: string;
  onChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-gray-500">{hint}</p>
      </div>
      {hasPin && (
        <p className="text-xs text-emerald-500">Code déjà défini</p>
      )}
      <input
        type="password"
        inputMode="numeric"
        pattern="\d{4}"
        maxLength={4}
        value={pin}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
        placeholder="••••"
        className="w-full rounded-lg border border-gray-700 bg-[#0f1117] px-3 py-2 text-center text-white tracking-[0.5em]"
      />
      <button
        type="button"
        onClick={onSave}
        disabled={saving || pin.length !== 4}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-white disabled:opacity-50"
        style={{ backgroundColor: "#ff6b35" }}
      >
        {saving && <Loader2 className="animate-spin" size={14} />}
        Sauvegarder
      </button>
    </div>
  );
}
