"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addMenuItemAction,
  loadMenuItemsAction,
} from "@/app/dashboard/menu/actions";

// TODO: retirer après test — business_id en dur
const TEST_BUSINESS_ID = "fef05996-6b89-41d8-8aad-8c5d2d6718be";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif';

const CATEGORIES = [
  "Burgers",
  "Frites",
  "Boissons",
  "Desserts",
  "Menus",
  "Salades",
  "Autres",
];

const CATEGORY_EMOJI: Record<string, string> = {
  Burgers: "🍔",
  Frites: "🍟",
  Boissons: "🥤",
  Desserts: "🍰",
  Menus: "🍱",
  Salades: "🥗",
  Autres: "🍽️",
};

const SWIPE_DELETE_WIDTH = 88;

type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  created_at?: string;
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

function SwipeableRow({
  item,
  onDelete,
  deleting,
}: {
  item: MenuItem;
  onDelete: (id: string, name: string) => void;
  deleting: boolean;
}) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startOffset = useRef(0);

  function onPointerDown(e: ReactPointerEvent) {
    if (deleting) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    startX.current = e.clientX;
    startOffset.current = offset;
    setDragging(true);
  }

  function onPointerMove(e: ReactPointerEvent) {
    if (!dragging) return;
    const delta = e.clientX - startX.current;
    const next = Math.min(0, Math.max(-SWIPE_DELETE_WIDTH, startOffset.current + delta));
    setOffset(next);
  }

  function onPointerUp() {
    setDragging(false);
    setOffset((current) =>
      current < -SWIPE_DELETE_WIDTH / 2 ? -SWIPE_DELETE_WIDTH : 0
    );
  }

  function closeSwipe() {
    setOffset(0);
  }

  return (
    <li className="relative overflow-hidden rounded-[16px]">
      <div
        className="absolute inset-y-0 right-0 flex w-[88px] items-center justify-center rounded-r-[16px] bg-[#FF3B30]"
        aria-hidden
      >
        <button
          type="button"
          onClick={() => onDelete(item.id, item.name)}
          disabled={deleting}
          className="px-3 text-[15px] font-semibold text-white disabled:opacity-60"
        >
          {deleting ? "…" : "Suppr."}
        </button>
      </div>

      <div
        className={`relative flex items-center gap-4 bg-white px-4 py-3.5 ${
          dragging ? "" : "transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
        }`}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={offset < 0 ? closeSwipe : undefined}
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F5F5F7] text-xl">
          {itemEmoji(item.category)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-medium text-[#1D1D1F]">
            {item.name}
          </p>
          <p className="text-[13px] text-[#86868B]">{item.category}</p>
        </div>
        <span className="shrink-0 text-[17px] font-semibold tabular-nums text-[#0071E3]">
          {formatPrice(item.price)}
        </span>
        <ChevronRight
          className="h-4 w-4 shrink-0 text-[#C7C7CC] opacity-0 sm:opacity-100"
          strokeWidth={2.5}
        />
      </div>
    </li>
  );
}

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const resolveBusiness = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage({ type: "error", text: "Session expirée. Reconnectez-vous." });
      return null;
    }

    const bizId = TEST_BUSINESS_ID;
    console.log("[menu] business_id (test):", bizId, "user:", user.email);
    setBusinessId(bizId);
    return bizId;
  }, []);

  const loadItems = useCallback(async (bizId: string) => {
    setLoading(true);
    const result = await loadMenuItemsAction(bizId);

    if ("error" in result) {
      console.error("[menu] loadItems error:", result.error);
      setMessage({ type: "error", text: result.error });
      setItems([]);
    } else {
      setItems(result.items);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      const bizId = await resolveBusiness();
      if (bizId) {
        await loadItems(bizId);
      } else {
        setLoading(false);
      }
    })();
  }, [resolveBusiness, loadItems]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const parsedPrice = parseFloat(price.replace(",", "."));
    if (!name.trim() || Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      setMessage({
        type: "error",
        text: "Nom et prix valides requis.",
      });
      return;
    }

    setSubmitting(true);

    let bizId: string | null = businessId;
    if (!bizId) {
      bizId = await resolveBusiness();
    }

    if (!bizId) {
      setSubmitting(false);
      return;
    }

    const trimmedName = name.trim();

    console.log("[menu] handleSubmit — ajout:", {
      businessId: bizId,
      name: trimmedName,
      price: parsedPrice,
      category,
    });

    const result = await addMenuItemAction({
      businessId: bizId,
      name: trimmedName,
      price: parsedPrice,
      category,
      categoryEmoji: CATEGORY_EMOJI[category],
    });

    console.log("[menu] handleSubmit — résultat:", result);

    if ("error" in result) {
      setMessage({ type: "error", text: result.error });
      setSubmitting(false);
      return;
    }

    setName("");
    setPrice("");
    setCategory(CATEGORIES[0]);
    setMessage({ type: "success", text: `"${trimmedName}" ajouté au menu.` });
    setSubmitting(false);
    loadItems(bizId);
  }

  async function deleteItem(id: string, itemName: string) {
    setDeletingId(id);
    let query = supabase.from("menu_items").delete().eq("id", id);
    if (businessId) {
      query = query.eq("business_id", businessId);
    }
    const { error } = await query;

    if (error) {
      setMessage({ type: "error", text: error.message });
      setDeletingId(null);
      return;
    }

    setMessage({ type: "success", text: `"${itemName}" supprimé.` });
    setDeletingId(null);
    if (businessId) loadItems(businessId);
  }

  const grouped = CATEGORIES.map((cat) => ({
    category: cat,
    items: items.filter((i) => i.category === cat),
  })).filter((g) => g.items.length > 0);

  const uncategorized = items.filter((i) => !CATEGORIES.includes(i.category));

  return (
    <div
      className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] antialiased"
      style={{ fontFamily: APPLE_FONT }}
    >
      <header className="sticky top-0 z-20 border-b border-black/[0.06] bg-white/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4 sm:px-6">
          <Link
            href="/dashboard"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5F5F7] transition hover:bg-[#E8E8ED] active:scale-95"
            aria-label="Retour"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
          </Link>
          <div>
            <h1 className="text-[28px] font-bold tracking-tight">Menu</h1>
            <p className="text-[15px] text-[#86868B]">Articles & catégories</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        {message && (
          <div
            className={`mb-5 animate-[fadeIn_0.35s_ease-out] rounded-[16px] px-4 py-3 text-[15px] ${
              message.type === "success"
                ? "bg-[#34C759]/12 text-[#248A3D]"
                : "bg-[#FF3B30]/12 text-[#D70015]"
            }`}
            role="status"
          >
            {message.text}
          </div>
        )}

        <section className="mb-8">
          <h2 className="mb-2 px-4 text-[13px] font-semibold uppercase tracking-wide text-[#86868B]">
            Nouvel article
          </h2>
          <form
            onSubmit={handleSubmit}
            className="overflow-hidden rounded-[20px] border border-black/[0.04] bg-white shadow-[0_2px_16px_rgba(0,0,0,0.06)]"
          >
            <label className="flex items-center justify-between gap-4 border-b border-[#E5E5EA] px-4 py-3.5">
              <span className="shrink-0 text-[17px] text-[#1D1D1F]">Nom</span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Cheeseburger"
                className="min-w-0 flex-1 bg-transparent text-right text-[17px] text-[#1D1D1F] placeholder:text-[#C7C7CC] outline-none"
              />
            </label>

            <label className="flex items-center justify-between gap-4 border-b border-[#E5E5EA] px-4 py-3.5">
              <span className="shrink-0 text-[17px] text-[#1D1D1F]">Prix</span>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0,00"
                  className="w-24 bg-transparent text-right text-[17px] text-[#1D1D1F] placeholder:text-[#C7C7CC] outline-none"
                />
                <span className="text-[17px] text-[#86868B]">€</span>
              </div>
            </label>

            <label className="flex items-center justify-between gap-4 px-4 py-3.5">
              <span className="shrink-0 text-[17px] text-[#1D1D1F]">
                Catégorie
              </span>
              <div className="relative flex items-center">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="appearance-none bg-transparent pr-6 text-right text-[17px] text-[#0071E3] outline-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_EMOJI[cat]} {cat}
                    </option>
                  ))}
                </select>
                <ChevronRight className="pointer-events-none absolute right-0 h-4 w-4 rotate-90 text-[#C7C7CC]" />
              </div>
            </label>

            <div className="border-t border-[#E5E5EA] bg-[#FAFAFA] px-4 py-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-[14px] bg-[#0071E3] py-3.5 text-[17px] font-semibold text-white shadow-[0_4px_14px_rgba(0,113,227,0.35)] transition-all duration-300 hover:bg-[#0077ED] active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? "Ajout…" : "Ajouter au menu"}
              </button>
            </div>
          </form>
        </section>

        <section>
          <h2 className="mb-2 px-4 text-[13px] font-semibold uppercase tracking-wide text-[#86868B]">
            Articles · {items.length}
          </h2>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E5E5EA] border-t-[#0071E3]" />
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-black/[0.08] bg-white/60 px-8 py-16 text-center backdrop-blur-sm">
              <span className="mb-3 block text-4xl">🍽️</span>
              <p className="text-[17px] font-medium">Aucun article</p>
              <p className="mt-1 text-[15px] text-[#86868B]">
                Ajoutez votre premier produit ci-dessus
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map(({ category: cat, items: catItems }) => (
                <div key={cat}>
                  <p className="mb-2 px-4 text-[13px] font-semibold text-[#86868B]">
                    {CATEGORY_EMOJI[cat]} {cat}
                  </p>
                  <ul className="overflow-hidden rounded-[20px] border border-black/[0.04] bg-white shadow-[0_2px_16px_rgba(0,0,0,0.06)] divide-y divide-[#E5E5EA]">
                    {catItems.map((item) => (
                      <SwipeableRow
                        key={item.id}
                        item={item}
                        onDelete={deleteItem}
                        deleting={deletingId === item.id}
                      />
                    ))}
                  </ul>
                </div>
              ))}

              {uncategorized.length > 0 && (
                <div>
                  <p className="mb-2 px-4 text-[13px] font-semibold text-[#86868B]">
                    Autres catégories
                  </p>
                  <ul className="overflow-hidden rounded-[20px] border border-black/[0.04] bg-white shadow-[0_2px_16px_rgba(0,0,0,0.06)] divide-y divide-[#E5E5EA]">
                    {uncategorized.map((item) => (
                      <SwipeableRow
                        key={item.id}
                        item={item}
                        onDelete={deleteItem}
                        deleting={deletingId === item.id}
                      />
                    ))}
                  </ul>
                </div>
              )}

              <p className="px-4 text-center text-[13px] text-[#86868B]">
                Glissez vers la gauche pour supprimer un article
              </p>
            </div>
          )}
        </section>
      </main>

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
      `}</style>
    </div>
  );
}
