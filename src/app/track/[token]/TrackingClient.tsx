"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CheckCircle2, ChefHat, Clock, Package } from "lucide-react";

type Status =
  | "en_attente"
  | "en_preparation"
  | "pret"
  | "livre"
  | "annule"
  | string;

type TicketData = {
  public_token: string;
  ticket_number: string;
  order_id: string;
  status: Status;
  total: number;
  created_at: string;
  business_name: string;
};

const STEPS: { key: Status; label: string; Icon: any }[] = [
  { key: "en_attente",     label: "Reçue",      Icon: Clock },
  { key: "en_preparation", label: "En cuisine", Icon: ChefHat },
  { key: "pret",           label: "Prête",      Icon: Package },
  { key: "livre",          label: "Servie",     Icon: CheckCircle2 },
];

export function TrackingClient({
  token,
  initial,
}: {
  token: string;
  initial: TicketData;
}) {
  const [data, setData] = useState<TicketData>(initial);

  useEffect(() => {
    const id = setInterval(async () => {
      const res = await fetch(`/api/tickets/${token}`);
      if (res.ok) setData(await res.json());
    }, 8000);
    return () => clearInterval(id);
  }, [token]);

  const currentIdx = Math.max(
    0,
    STEPS.findIndex((s) => s.key === data.status)
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-white p-6">
      <div className="max-w-md mx-auto space-y-6">
        <header className="text-center pt-8">
          <p className="text-sm uppercase tracking-wider text-gray-500">
            {data.business_name}
          </p>
          <h1 className="text-5xl font-black mt-2">{data.ticket_number}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Commande du {formatDate(data.created_at)}
          </p>
        </header>

        <div className="rounded-2xl bg-white shadow-sm border p-6 space-y-6">
          <div className="space-y-4">
            {STEPS.map((step, idx) => {
              const done = idx <= currentIdx;
              const current = idx === currentIdx;
              return (
                <div key={step.key} className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      done
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-100 text-gray-400"
                    } ${current ? "ring-4 ring-emerald-200" : ""}`}
                  >
                    <step.Icon size={18} />
                  </div>
                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        done ? "text-gray-900" : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t pt-4 flex justify-between">
            <span className="text-sm text-gray-500">Total commande</span>
            <span className="font-semibold">{formatCurrency(Number(data.total))}</span>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400">
          Cette page s&apos;actualise toutes les 8 secondes.
        </p>
      </div>
    </main>
  );
}
