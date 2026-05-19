"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: "#0f1117" }}
    >
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">Connexion</h1>
          <p className="mt-2 text-sm text-gray-400">
            Accédez à votre espace FastFood SaaS
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-800 bg-[#161922] p-8 shadow-xl"
        >
          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <label className="mb-4 block">
            <span className="mb-1.5 block text-sm font-medium text-gray-300">
              Email
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-[#0f1117] px-4 py-2.5 text-white placeholder-gray-500 outline-none transition focus:border-[#ff6b35] focus:ring-1 focus:ring-[#ff6b35]"
              placeholder="vous@exemple.com"
            />
          </label>

          <label className="mb-6 block">
            <span className="mb-1.5 block text-sm font-medium text-gray-300">
              Mot de passe
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-[#0f1117] px-4 py-2.5 text-white placeholder-gray-500 outline-none transition focus:border-[#ff6b35] focus:ring-1 focus:ring-[#ff6b35]"
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "#ff6b35" }}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>

          <p className="mt-6 text-center text-sm text-gray-400">
            Pas encore de compte ?{" "}
            <Link
              href="/register"
              className="font-medium transition hover:underline"
              style={{ color: "#ff6b35" }}
            >
              S&apos;inscrire
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
