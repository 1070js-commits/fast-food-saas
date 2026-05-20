"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChefHat, Clock, RefreshCw } from "lucide-react";
import {
  updateOrderStatusAction,
  type KitchenOrderStatus,
} from "@/app/dashboard/cuisine/actions";
import { createClient } from "@/lib/supabase/client";
import { getClientBusinessId } from "@/lib/active-business";
import { useEmployeeModuleGuard } from "@/components/employe/useEmployeeModuleGuard";

const supabase = createClient();

const ACTIVE_STATUSES: KitchenOrderStatus[] = [
  "en_attente",
  "en_preparation",
  "pret",
];

const KITCHEN_STATUSES = [...ACTIVE_STATUSES, "pending"] as const;

type OrderItemRow = {
  quantity: number;
  unit_price: number;
  menu_items: { name: string } | { name: string }[] | null;
};

type KitchenOrder = {
  id: string;
  status: KitchenOrderStatus;
  total: number;
  type: string;
  created_at: string;
  notes: string | null;
  order_items: OrderItemRow[];
};

const COLUMNS: {
  status: KitchenOrderStatus;
  title: string;
  accent: string;
  border: string;
  badge: string;
}[] = [
  {
    status: "en_attente",
    title: "En attente",
    accent: "#ff453a",
    border: "rgba(255, 69, 58, 0.45)",
    badge: "bg-[#ff453a]/20 text-[#ff6961]",
  },
  {
    status: "en_preparation",
    title: "En préparation",
    accent: "#ff9f0a",
    border: "rgba(255, 159, 10, 0.45)",
    badge: "bg-[#ff9f0a]/20 text-[#ffb340]",
  },
  {
    status: "pret",
    title: "Prêt",
    accent: "#30d158",
    border: "rgba(48, 209, 88, 0.45)",
    badge: "bg-[#30d158]/20 text-[#63e089]",
  },
];

function normalizeStatus(status: string): KitchenOrderStatus {
  if (status === "pending") return "en_attente";
  if (
    status === "en_attente" ||
    status === "en_preparation" ||
    status === "pret"
  ) {
    return status;
  }
  return "en_attente";
}

function itemName(menuItems: OrderItemRow["menu_items"]): string {
  if (!menuItems) return "Article";
  if (Array.isArray(menuItems)) return menuItems[0]?.name ?? "Article";
  return menuItems.name;
}

function orderLabel(id: string) {
  return `#${id.replace(/-/g, "").slice(0, 4).toUpperCase()}`;
}

function typeLabel(type: string) {
  if (type === "counter") return "Comptoir";
  if (type === "delivery") return "Livraison";
  if (type === "dine_in") return "Sur place";
  return type;
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function mapOrders(rows: Record<string, unknown>[]): KitchenOrder[] {
  return rows.map((row) => ({
    id: row.id as string,
    status: normalizeStatus(row.status as string),
    total: Number(row.total),
    type: (row.type as string) ?? "counter",
    created_at: row.created_at as string,
    notes: (row.notes as string | null) ?? null,
    order_items: (row.order_items as OrderItemRow[]) ?? [],
  }));
}

function OrderCard({
  order,
  updating,
  onStatusChange,
}: {
  order: KitchenOrder;
  updating: boolean;
  onStatusChange: (orderId: string, status: KitchenOrderStatus) => void;
}) {
  const elapsed = formatDistanceToNow(new Date(order.created_at), {
    addSuffix: false,
    locale: fr,
  });

  const column = COLUMNS.find((c) => c.status === order.status)!;

  const actions: {
    label: string;
    next: KitchenOrderStatus;
    className: string;
  }[] = [];

  if (order.status === "en_attente") {
    actions.push({
      label: "Commencer",
      next: "en_preparation",
      className: "bg-[#ff9f0a] hover:bg-[#ffb340] text-[#1a1200]",
    });
  }
  if (order.status === "en_preparation") {
    actions.push({
      label: "Marquer prêt",
      next: "pret",
      className: "bg-[#30d158] hover:bg-[#4ade80] text-[#0a1a0f]",
    });
    actions.push({
      label: "En attente",
      next: "en_attente",
      className: "bg-white/10 hover:bg-white/15 text-gray-200",
    });
  }
  if (order.status === "pret") {
    actions.push({
      label: "Reprendre",
      next: "en_preparation",
      className: "bg-white/10 hover:bg-white/15 text-gray-200",
    });
  }

  return (
    <article
      className="rounded-2xl border bg-[#161922] p-5 shadow-lg transition-all duration-300"
      style={{ borderColor: column.border }}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex h-3 w-3 shrink-0 rounded-full animate-pulse"
            style={{ backgroundColor: column.accent }}
            aria-hidden
          />
          <p className="text-sm font-medium uppercase tracking-wider text-gray-500">
            Commande
          </p>
        </div>
        <div className="text-right">
          <p
            className="text-2xl font-bold tabular-nums tracking-tight"
            style={{ color: column.accent }}
          >
            {orderLabel(order.id)}
          </p>
          <p className="mt-1 flex items-center justify-end gap-1 text-sm text-gray-500">
            <Clock className="h-3.5 w-3.5" />
            {elapsed}
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="rounded-lg bg-white/5 px-3 py-1 text-sm font-medium text-gray-300">
          {typeLabel(order.type)}
        </span>
        <span className="text-lg font-semibold tabular-nums text-white">
          {formatPrice(order.total)}
        </span>
      </div>

      {order.notes && (
        <p className="mb-4 rounded-xl border border-[#ff9f0a]/30 bg-[#ff9f0a]/10 px-4 py-3 text-base text-[#ffb340]">
          {order.notes}
        </p>
      )}

      <ul className="mb-5 space-y-2">
        {order.order_items.length === 0 ? (
          <li className="text-base text-gray-500">Chargement des articles…</li>
        ) : (
          order.order_items.map((line, index) => (
            <li
              key={`${order.id}-${index}`}
              className="flex items-center gap-3 rounded-xl bg-[#0f1117] px-4 py-3"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl font-bold tabular-nums text-white">
                {line.quantity}×
              </span>
              <span className="min-w-0 flex-1 text-lg font-semibold leading-snug text-white">
                {itemName(line.menu_items)}
              </span>
            </li>
          ))
        )}
      </ul>

      <div className="flex flex-col gap-2 sm:flex-row">
        {actions.map((action) => (
          <button
            key={action.next}
            type="button"
            disabled={updating}
            onClick={() => onStatusChange(order.id, action.next)}
            className={`flex-1 rounded-xl px-4 py-4 text-lg font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${action.className}`}
          >
            {updating ? "…" : action.label}
          </button>
        ))}
      </div>
    </article>
  );
}

export default function CuisinePage() {
  useEmployeeModuleGuard();
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  const loadOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    const { data, error: fetchError } = await supabase
      .from("orders")
      .select(
        `
        id,
        status,
        total,
        type,
        created_at,
        notes,
        order_items (
          quantity,
          unit_price,
          menu_items ( name )
        )
      `
      )
      .eq("business_id", getClientBusinessId())
      .in("status", [...KITCHEN_STATUSES])
      .order("created_at", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setOrders([]);
    } else {
      setError(null);
      setOrders(mapOrders((data ?? []) as Record<string, unknown>[]));
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadOrders();

    const channel = supabase
      .channel("kitchen-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `business_id=eq.${getClientBusinessId()}`,
        },
        () => {
          loadOrders(true);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_items",
        },
        () => {
          loadOrders(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadOrders]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const ordersByStatus = useMemo(() => {
    const grouped: Record<KitchenOrderStatus, KitchenOrder[]> = {
      en_attente: [],
      en_preparation: [],
      pret: [],
    };
    for (const order of orders) {
      grouped[order.status].push(order);
    }
    return grouped;
  }, [orders]);

  const totalActive = orders.length;

  async function handleStatusChange(
    orderId: string,
    status: KitchenOrderStatus
  ) {
    setUpdatingId(orderId);
    setError(null);

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );

    const result = await updateOrderStatusAction(orderId, status);

    if ("error" in result) {
      setError(result.error);
      loadOrders(true);
    }

    setUpdatingId(null);
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0f1117] text-white antialiased">
      <header className="sticky top-0 z-20 border-b border-gray-800 bg-[#0f1117]/95 px-4 py-4 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/dashboard"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-800 bg-[#161922] text-gray-300 transition hover:border-[#ff6b35]/50 hover:text-white active:scale-95"
              aria-label="Retour"
            >
              <ChevronLeft className="h-6 w-6" strokeWidth={2.5} />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <ChefHat className="h-7 w-7 text-[#ff6b35]" strokeWidth={2.25} />
                <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
                  Cuisine
                </h1>
              </div>
              <p className="text-sm text-gray-500 sm:text-base">
                Temps réel · {totalActive} commande
                {totalActive !== 1 ? "s" : ""} active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <p className="hidden text-lg tabular-nums text-gray-400 sm:block">
              {now.toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <button
              type="button"
              onClick={() => loadOrders(true)}
              disabled={refreshing}
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-800 bg-[#161922] text-gray-300 transition hover:border-[#ff6b35]/50 hover:text-white disabled:opacity-50"
              aria-label="Actualiser"
            >
              <RefreshCw
                className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div
          className="mx-4 mt-4 rounded-xl border border-[#ff453a]/40 bg-[#ff453a]/10 px-4 py-3 text-base text-[#ff6961] sm:mx-6"
          role="alert"
        >
          {error}
        </div>
      )}

      <main className="mx-auto w-full max-w-[1800px] flex-1 p-4 sm:p-6">
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-32">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-800 border-t-[#ff6b35]" />
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
            {COLUMNS.map((column) => {
              const columnOrders = ordersByStatus[column.status];
              return (
                <section
                  key={column.status}
                  className="flex min-h-[320px] flex-col rounded-2xl border border-gray-800 bg-[#12151c] lg:min-h-[calc(100vh-140px)]"
                >
                  <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: column.accent }}
                      />
                      <h2 className="text-xl font-bold sm:text-2xl">
                        {column.title}
                      </h2>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-lg font-bold tabular-nums ${column.badge}`}
                    >
                      {columnOrders.length}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
                    {columnOrders.length === 0 ? (
                      <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-gray-800 py-16 text-center">
                        <span className="mb-3 text-5xl opacity-40">—</span>
                        <p className="text-lg text-gray-500">Aucune commande</p>
                      </div>
                    ) : (
                      columnOrders.map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          updating={updatingId === order.id}
                          onStatusChange={handleStatusChange}
                        />
                      ))
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
