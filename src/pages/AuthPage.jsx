import React, { useState } from "react";
import { motion } from "framer-motion";
import { signInWithEmail, signUpWithEmail } from "@/lib/supabase";

export default function AuthPage() {
  const [mode, setMode]       = useState("login"); // "login" | "signup"
  const [email, setEmail]     = useState("");
  const [password, setPass]   = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      if (mode === "login") {
        const { error: e } = await signInWithEmail(email, password);
        if (e) throw e;
      } else {
        const { error: e } = await signUpWithEmail(email, password);
        if (e) throw e;
        setDone(true);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-neutral-950 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        {/* Logo mark */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-neutral-900 dark:bg-white mb-4">
            <span className="text-xl">₹</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Expense Tracker
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {mode === "login" ? "Welcome back." : "Create your account."}
          </p>
        </div>

        {done ? (
          <div className="text-center text-sm text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-5">
            Check your email to confirm your account, then sign in.
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 transition"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPass(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              className="w-full px-4 py-3 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 transition"
            />

            {error && (
              <p className="text-xs text-red-500 px-1">{error}</p>
            )}

            <button
              onClick={submit}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-neutral-900 dark:bg-neutral-50 text-white dark:text-neutral-900 text-sm font-medium hover:bg-neutral-700 dark:hover:bg-neutral-200 disabled:opacity-50 transition"
            >
              {loading ? "…" : mode === "login" ? "Sign in" : "Create account"}
            </button>

            <p className="text-center text-xs text-neutral-500 pt-2">
              {mode === "login" ? "No account? " : "Already have one? "}
              <button
                onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
                className="text-neutral-900 dark:text-neutral-100 underline underline-offset-2"
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
