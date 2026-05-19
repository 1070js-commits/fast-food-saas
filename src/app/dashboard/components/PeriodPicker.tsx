"use client";

import { useRouter } from "next/navigation";

export function PeriodPicker({ current }: { current: number }) {
  const router = useRouter();
  const opts = [7, 14, 30, 90];
  return (
    <div className="inline-flex rounded-md border bg-white p-1">
      {opts.map((d) => (
        <button
          key={d}
          onClick={() => router.push(`/dashboard?days=${d}`)}
          className={`px-3 py-1 text-sm rounded ${
            current === d
              ? "bg-black text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {d} j
        </button>
      ))}
    </div>
  );
}
