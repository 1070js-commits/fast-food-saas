"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          business_name: businessName,
          phone,
        },
      },
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
      className="flex min-h-screen items-center justify-center px-4 py-12"
      style={{ backgroundColor: "#0f1117" }}
    >
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">Inscription</h1>
          <p className="mt-2 text-sm text-gray-400">
            Créez votre compte FastFood SaaS
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
              Nom
            </span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-[#0f1117] px-4 py-2.5 text-white placeholder-gray-500 outline-none transition focus:border-[#ff6b35] focus:ring-1 focus:ring-[#ff6b35]"
              placeholder="Jean Dupont"
            />
          </label>

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

          <label className="mb-4 block">
            <span className="mb-1.5 block text-sm font-medium text-gray-300">
              Mot de passe
            </span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-[#0f1117] px-4 py-2.5 text-white placeholder-gray-500 outline-none transition focus:border-[#ff6b35] focus:ring-1 focus:ring-[#ff6b35]"
              placeholder="••••••••"
            />
          </label>

          <label className="mb-4 block">
            <span className="mb-1.5 block text-sm font-medium text-gray-300">
              Nom du commerce
            </span>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-[#0f1117] px-4 py-2.5 text-white placeholder-gray-500 outline-none transition focus:border-[#ff6b35] focus:ring-1 focus:ring-[#ff6b35]"
              placeholder="Mon Fast-Food"
            />
          </label>

          <label className="mb-6 block">
            <span className="mb-1.5 block text-sm font-medium text-gray-300">
              Téléphone
            </span>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-[#0f1117] px-4 py-2.5 text-white placeholder-gray-500 outline-none transition focus:border-[#ff6b35] focus:ring-1 focus:ring-[#ff6b35]"
              placeholder="+33 6 12 34 56 78"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "#ff6b35" }}
          >
            {loading ? "Inscription..." : "Créer mon compte"}
          </button>

          <p className="mt-6 text-center text-sm text-gray-400">
            Déjà un compte ?{" "}
            <Link
              href="/login"
              className="font-medium transition hover:underline"
              style={{ color: "#ff6b35" }}
            >
              Se connecter
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
