"use client";

import { Delete } from "lucide-react";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"] as const;

type PinPadProps = {
  pin: string;
  onChange: (pin: string) => void;
  disabled?: boolean;
};

export function PinPad({ pin, onChange, disabled }: PinPadProps) {
  const handleKey = (key: (typeof KEYS)[number]) => {
    if (disabled) return;
    if (key === "") return;
    if (key === "del") {
      onChange(pin.slice(0, -1));
      return;
    }
    if (pin.length >= 4) return;
    onChange(pin + key);
  };

  return (
    <div className="w-full max-w-xs mx-auto space-y-6">
      <div className="flex justify-center gap-3">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-3 w-3 rounded-full transition-colors"
            style={{
              backgroundColor: pin.length > i ? "#ff6b35" : "#4b5563",
            }}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {KEYS.map((key, idx) => {
          if (key === "") {
            return <div key={`empty-${idx}`} />;
          }
          if (key === "del") {
            return (
              <button
                key="del"
                type="button"
                onClick={() => handleKey("del")}
                disabled={disabled || pin.length === 0}
                className="flex h-16 items-center justify-center rounded-xl border border-gray-700 bg-[#161922] text-gray-300 transition hover:border-[#ff6b35]/50 hover:bg-[#1a1e28] disabled:opacity-40"
                aria-label="Effacer"
              >
                <Delete size={22} />
              </button>
            );
          }
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleKey(key)}
              disabled={disabled}
              className="h-16 rounded-xl border border-gray-700 bg-[#161922] text-2xl font-semibold text-white transition hover:border-[#ff6b35]/50 hover:bg-[#1a1e28] hover:text-[#ff6b35] disabled:opacity-40"
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
}
