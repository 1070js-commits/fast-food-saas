"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Minus,
  Plus,
  ShoppingBag,
  X,
} from "lucide-react";
import { createOrderAction } from "@/app/dashboard/caisse/actions";
import { createClient } from "@/lib/supabase/client";

// TODO: retirer après test — business_id en dur
const TEST_BUSINESS_ID = "fef05996-6b89-41d8-8aad-8c5d2d6718be";

const supabase = createClient();

const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif';

const CATEGORIES = [
  "Tous",
  "Burgers",
  "Frites",
  "Boissons",
  "Desserts",
  "Menus",
  "Salades",
  "Autres",
];

const CATEGORY_EMOJI: Record<string, string> = {
  Tous: "✨",
  Burgers: "🍔",
  Frites: "🍟",
  Boissons: "🥤",
  Desserts: "🍰",
  Menus: "🍱",
  Salades: "🥗",
  Autres: "🍽️",
};

type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
};

type CartLine = {
  item: MenuItem;
  quantity: number;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function itemEmoji(category: string) {
  return CATEGORY_EMOJI[category] ?? "🍴";
}

function categoryLabel(
  categories: { name: string } | { name: string }[] | null
): string {
  if (!categories) return "Autres";
  if (Array.isArray(categories)) return categories[0]?.name ?? "Autres";
  return categories.name;
}

function CartContent({
  cart,
  total,
  itemCount,
  submitting,
  onUpdateQuantity,
  onRemoveLine,
  onClearCart,
  onValidate,
}: {
  cart: CartLine[];
  total: number;
  itemCount: number;
  submitting: boolean;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveLine: (id: string) => void;
  onClearCart: () => void;
  onValidate: () => void;
}) {
  return (
    <>
      <div className="flex items-baseline justify-between px-6 pt-6 pb-2">
        <h2 className="text-[22px] font-semibold tracking-tight text-[#1D1D1F]">
          Panier
        </h2>
        {itemCount > 0 && (
          <span className="text-[15px] font-medium text-[#86868B]">
            {itemCount} article{itemCount > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#F5F5F7] text-3xl">
              🛒
            </div>
            <p className="text-[17px] font-medium text-[#1D1D1F]">Panier vide</p>
            <p className="mt-1 max-w-[220px] text-[15px] leading-snug text-[#86868B]">
              Touchez un article pour l&apos;ajouter à la commande
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {cart.map((line) => (
              <li
                key={line.item.id}
                className="rounded-[18px] border border-black/[0.04] bg-white/80 p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] backdrop-blur-xl transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F5F5F7] text-xl">
                      {itemEmoji(line.item.category)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-[#1D1D1F]">
                        {line.item.name}
                      </p>
                      <p className="text-[13px] text-[#86868B]">
                        {formatPrice(line.item.price)}
                      </p>
                    </div>
                  </div>
                  <p className="shrink-0 text-[15px] font-semibold tabular-nums text-[#1D1D1F]">
                    {formatPrice(line.item.price * line.quantity)}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1 rounded-full bg-[#F5F5F7] p-1">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(line.item.id, -1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[#1D1D1F] transition hover:bg-white active:scale-95"
                      aria-label="Diminuer"
                    >
                      <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </button>
                    <span className="w-8 text-center text-[15px] font-semibold tabular-nums text-[#1D1D1F]">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(line.item.id, 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[#0071E3] transition hover:bg-white active:scale-95"
                      aria-label="Augmenter"
                    >
                      <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveLine(line.item.id)}
                    className="text-[13px] font-medium text-[#FF3B30] transition-opacity hover:opacity-70"
                  >
                    Retirer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-black/[0.06] bg-white/90 px-6 py-5 backdrop-blur-xl">
        <div className="mb-4 flex items-end justify-between">
          <span className="text-[15px] font-medium text-[#86868B]">Total</span>
          <span className="text-[28px] font-semibold tracking-tight tabular-nums text-[#1D1D1F]">
            {formatPrice(total)}
          </span>
        </div>
        <div className="flex gap-3">
          {cart.length > 0 && (
            <button
              type="button"
              onClick={onClearCart}
              className="rounded-[14px] bg-[#F5F5F7] px-5 py-4 text-[15px] font-semibold text-[#1D1D1F] transition active:scale-[0.98] hover:bg-[#E8E8ED]"
            >
              Vider
            </button>
          )}
          <button
            type="button"
            onClick={onValidate}
            disabled={cart.length === 0 || submitting}
            className="flex flex-1 items-center justify-center rounded-[14px] bg-[#0071E3] py-4 text-[17px] font-semibold text-white shadow-[0_4px_14px_rgba(0,113,227,0.35)] transition-all duration-300 hover:bg-[#0077ED] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#0071E3]/40 disabled:shadow-none"
          >
            {submitting ? "Validation…" : "Valider la commande"}
          </button>
        </div>
      </div>
    </>
  );
}

function ProductCard({
  item,
  onAdd,
}: {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}) {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      type="button"
      onClick={() => onAdd(item)}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className={`group flex flex-col rounded-[20px] border border-white/60 bg-white/70 p-5 text-left shadow-[0_2px_16px_rgba(0,0,0,0.06)] backdrop-blur-xl transition-all duration-300 ease-out hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:scale-[0.98] ${
        pressed ? "scale-[0.97] shadow-[0_2px_8px_rgba(0,0,0,0.04)]" : ""
      }`}
    >
      <span className="mb-4 flex h-[72px] w-full items-center justify-center rounded-[16px] bg-[#F5F5F7] text-[44px] transition-transform duration-300 group-hover:scale-105">
        {itemEmoji(item.category)}
      </span>
      <span className="mb-1 line-clamp-2 text-[15px] font-semibold leading-snug text-[#1D1D1F]">
        {item.name}
      </span>
      <span className="mt-auto text-[17px] font-semibold tabular-nums text-[#0071E3]">
        {formatPrice(item.price)}
      </span>
    </button>
  );
}

export default function CaissePage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [category, setCategory] = useState("Tous");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [businessName, setBusinessName] = useState("Mon commerce");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadMenu = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("menu_items")
      .select("id, name, price, category_id, categories(name)")
      .eq("is_available", true)
      .order("name");

    if (error) {
      setMessage({ type: "error", text: error.message });
      setMenuItems([]);
    } else {
      setMenuItems(
        (data ?? []).map((row) => ({
          id: row.id,
          name: row.name,
          price: Number(row.price),
          category: categoryLabel(row.categories),
        }))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMenu();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const name =
          user.user_metadata?.business_name ??
          user.user_metadata?.full_name ??
          user.email?.split("@")[0];
        if (name) setBusinessName(name);
      }
    });
  }, [loadMenu]);

  useEffect(() => {
    if (sheetOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sheetOpen]);

  const filteredItems = useMemo(() => {
    if (category === "Tous") return menuItems;
    return menuItems.filter((item) => item.category === category);
  }, [menuItems, category]);

  const total = useMemo(
    () => cart.reduce((sum, line) => sum + line.item.price * line.quantity, 0),
    [cart]
  );

  const itemCount = useMemo(
    () => cart.reduce((sum, line) => sum + line.quantity, 0),
    [cart]
  );

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((line) => line.item.id === item.id);
      if (existing) {
        return prev.map((line) =>
          line.item.id === item.id
            ? { ...line, quantity: line.quantity + 1 }
            : line
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  }

  function updateQuantity(itemId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((line) =>
          line.item.id === itemId
            ? { ...line, quantity: line.quantity + delta }
            : line
        )
        .filter((line) => line.quantity > 0)
    );
  }

  function removeLine(itemId: string) {
    setCart((prev) => prev.filter((line) => line.item.id !== itemId));
  }

  function clearCart() {
    setCart([]);
  }

  async function validateOrder() {
    if (cart.length === 0) return;

    setSubmitting(true);
    setMessage(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage({ type: "error", text: "Session expirée. Reconnectez-vous." });
      setSubmitting(false);
      return;
    }

    const result = await createOrderAction(
      TEST_BUSINESS_ID,
      total,
      cart.map((line) => ({
        menuItemId: line.item.id,
        quantity: line.quantity,
        unitPrice: line.item.price,
      }))
    );

    if ("error" in result) {
      setMessage({ type: "error", text: result.error });
      setSubmitting(false);
      return;
    }

    setCart([]);
    setSheetOpen(false);
    setMessage({
      type: "success",
      text: `Commande validée — ${formatPrice(total)}`,
    });
    setSubmitting(false);
  }

  const cartProps = {
    cart,
    total,
    itemCount,
    submitting,
    onUpdateQuantity: updateQuantity,
    onRemoveLine: removeLine,
    onClearCart: clearCart,
    onValidate: validateOrder,
  };

  return (
    <div
      className="flex min-h-screen flex-col bg-[#F5F5F7] text-[#1D1D1F] antialiased"
      style={{ fontFamily: APPLE_FONT }}
    >
      <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-white/80 px-4 py-3 backdrop-blur-2xl sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/dashboard"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5F5F7] text-[#1D1D1F] transition hover:bg-[#E8E8ED] active:scale-95"
              aria-label="Retour"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-[20px] font-semibold tracking-tight sm:text-[22px]">
                {businessName}
              </h1>
              <p className="text-[13px] text-[#86868B]">Caisse</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full bg-[#F5F5F7] px-4 py-2 lg:flex">
            <ShoppingBag className="h-4 w-4 text-[#0071E3]" strokeWidth={2.5} />
            <span className="text-[15px] font-semibold tabular-nums text-[#1D1D1F]">
              {formatPrice(total)}
            </span>
            {itemCount > 0 && (
              <span className="text-[13px] text-[#86868B]">
                · {itemCount}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex items-center gap-2 rounded-full bg-[#0071E3] px-4 py-2 text-white shadow-[0_4px_14px_rgba(0,113,227,0.3)] transition active:scale-95 lg:hidden"
          >
            <ShoppingBag className="h-4 w-4" strokeWidth={2.5} />
            <span className="text-[15px] font-semibold tabular-nums">
              {formatPrice(total)}
            </span>
            {itemCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/25 px-1.5 text-[11px] font-bold">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {message && (
        <div
          className={`mx-4 mt-3 animate-[fadeIn_0.35s_ease-out] rounded-[16px] px-4 py-3 text-[15px] sm:mx-6 ${
            message.type === "success"
              ? "bg-[#34C759]/12 text-[#248A3D]"
              : "bg-[#FF3B30]/12 text-[#D70015]"
          }`}
          role="status"
        >
          {message.text}
        </div>
      )}

      <div className="mx-auto flex w-full max-w-[1600px] flex-1 min-h-0">
        <section className="flex min-w-0 flex-1 flex-col overflow-hidden p-4 sm:p-6 lg:pr-4">
          <div className="mb-5 -mx-1 overflow-x-auto px-1 pb-1 scrollbar-none">
            <div className="flex w-max gap-2">
              {CATEGORIES.map((cat) => {
                const active = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-[15px] font-medium transition-all duration-300 ${
                      active
                        ? "bg-[#1D1D1F] text-white shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
                        : "bg-white/80 text-[#1D1D1F] shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:bg-white"
                    }`}
                  >
                    <span className="text-base">{CATEGORY_EMOJI[cat]}</span>
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8E8ED] border-t-[#0071E3]" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-[20px] border border-dashed border-black/[0.08] bg-white/50 px-8 py-16 text-center backdrop-blur-sm">
              <span className="mb-4 text-5xl">📋</span>
              <p className="text-[17px] font-medium text-[#1D1D1F]">
                Aucun article
              </p>
              <p className="mt-1 text-[15px] text-[#86868B]">
                Cette catégorie est vide pour le moment
              </p>
              <Link
                href="/dashboard/menu"
                className="mt-5 text-[15px] font-semibold text-[#0071E3] hover:underline"
              >
                Gérer le menu →
              </Link>
            </div>
          ) : (
            <div className="grid flex-1 content-start gap-3 overflow-y-auto pb-28 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 lg:pb-6">
              {filteredItems.map((item) => (
                <ProductCard key={item.id} item={item} onAdd={addToCart} />
              ))}
            </div>
          )}
        </section>

        <aside className="hidden w-[min(100%,400px)] shrink-0 flex-col border-l border-black/[0.06] bg-white/60 backdrop-blur-2xl lg:flex">
          <CartContent {...cartProps} />
        </aside>
      </div>

      {sheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity animate-[fadeIn_0.25s_ease-out]"
            onClick={() => setSheetOpen(false)}
            aria-label="Fermer le panier"
          />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-[24px] bg-white/95 shadow-[0_-8px_40px_rgba(0,0,0,0.12)] backdrop-blur-2xl animate-[slideUp_0.35s_cubic-bezier(0.32,0.72,0,1)]">
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-[#D1D1D6]" />
            </div>
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F5F7] text-[#86868B]"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <CartContent {...cartProps} />
            </div>
          </div>
        </div>
      )}

      {!sheetOpen && itemCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.06] bg-white/90 p-4 backdrop-blur-2xl lg:hidden animate-[slideUp_0.35s_cubic-bezier(0.32,0.72,0,1)]">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex w-full items-center justify-between rounded-[16px] bg-[#0071E3] px-5 py-4 text-white shadow-[0_4px_20px_rgba(0,113,227,0.4)] active:scale-[0.98]"
          >
            <span className="text-[17px] font-semibold">
              Voir le panier · {itemCount}
            </span>
            <span className="text-[17px] font-semibold tabular-nums">
              {formatPrice(total)}
            </span>
          </button>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
