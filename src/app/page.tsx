"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  clearEmployeeSessionLocal,
  saveEmployeeSessionLocal,
  type EmployeeSession,
} from "@/lib/employee-session";
import {
  clearManagerSessionLocal,
  saveManagerSessionLocal,
  type ManagerSession,
} from "@/lib/manager-session";

const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif';

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"] as const;

type Profile = "gerant" | "employe";

export default function HomePage() {
  const router = useRouter();
  const [restaurantName, setRestaurantName] = useState("Restaurant");
  const [profile, setProfile] = useState<Profile>("gerant");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/branding")
      .then((r) => r.json())
      .then((d) => {
        if (d.name) setRestaurantName(d.name);
      })
      .catch(() => {});
  }, []);

  const triggerShake = useCallback(() => {
    setShake(true);
    setPin("");
    window.setTimeout(() => setShake(false), 500);
  }, []);

  const verifyPin = useCallback(
    async (code: string) => {
      setBusy(true);
      try {
        const res = await fetch("/api/auth/verify-pin", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ pin: code, role: profile }),
        });
        const data = await res.json();

        if (!res.ok) {
          triggerShake();
          return;
        }

        if (profile === "gerant") {
          const session: ManagerSession = {
            businessId: data.businessId,
            businessName: data.businessName,
            expiresAt: data.expiresAt,
          };
          clearEmployeeSessionLocal();
          saveManagerSessionLocal(session);
          router.replace("/dashboard");
        } else {
          const session: EmployeeSession = {
            businessId: data.businessId,
            businessName: data.businessName,
            expiresAt: data.expiresAt,
          };
          clearManagerSessionLocal();
          saveEmployeeSessionLocal(session);
          router.replace("/employe/dashboard");
        }
      } catch {
        triggerShake();
      } finally {
        setBusy(false);
      }
    },
    [profile, router, triggerShake]
  );

  useEffect(() => {
    if (pin.length === 4 && !busy) {
      verifyPin(pin);
    }
  }, [pin, busy, verifyPin]);

  const handleKey = (key: (typeof KEYS)[number]) => {
    if (busy) return;
    if (key === "") return;
    if (key === "del") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (pin.length >= 4) return;
    setPin((p) => p + key);
  };

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-8 py-16"
      style={{ backgroundColor: "#000000", fontFamily: APPLE_FONT }}
    >
      <div className="flex w-full max-w-sm flex-col items-center">
        <p className="mb-16 text-center text-[13px] font-medium tracking-wide text-white/45">
          {restaurantName}
        </p>

        <h1 className="mb-12 text-center text-[34px] font-bold leading-tight tracking-tight text-white">
          Bonjour
        </h1>

        <div className="mb-14 flex w-full gap-3">
          {(
            [
              { id: "gerant" as const, label: "Gérant" },
              { id: "employe" as const, label: "Employé" },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setProfile(p.id);
                setPin("");
              }}
              disabled={busy}
              className={cn(
                "flex-1 rounded-full py-3 text-[15px] font-semibold transition-all duration-200",
                profile === p.id
                  ? "bg-white text-black"
                  : "bg-transparent text-white/35 hover:text-white/55"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div
          className={cn(
            "mb-14 flex justify-center gap-5",
            shake && "animate-pin-shake"
          )}
        >
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="text-[22px] leading-none transition-colors duration-150"
              style={{ color: pin.length > i ? "#ffffff" : "rgba(255,255,255,0.22)" }}
            >
              ●
            </span>
          ))}
        </div>

        <div className="mb-16 grid w-full max-w-[280px] grid-cols-3 gap-y-2">
          {KEYS.map((key, idx) => {
            if (key === "") {
              return <div key={`spacer-${idx}`} className="h-[76px]" />;
            }
            const isDel = key === "del";
            const keyId = isDel ? "del" : key;
            return (
              <button
                key={keyId}
                type="button"
                disabled={busy || (isDel && pin.length === 0)}
                onPointerDown={() => setActiveKey(keyId)}
                onPointerUp={() => setActiveKey(null)}
                onPointerLeave={() => setActiveKey(null)}
                onClick={() => handleKey(key)}
                className="relative flex h-[76px] items-center justify-center disabled:opacity-30"
                aria-label={isDel ? "Effacer" : key}
              >
                {activeKey === keyId && (
                  <span className="absolute inset-0 m-auto h-[72px] w-[72px] rounded-full bg-white/12" />
                )}
                <span
                  className={cn(
                    "relative z-10 select-none",
                    isDel
                      ? "text-[15px] font-medium text-white/70"
                      : "text-[32px] font-light tabular-nums text-white"
                  )}
                >
                  {isDel ? "⌫" : key}
                </span>
              </button>
            );
          })}
        </div>

      </div>
    </main>
  );
}
