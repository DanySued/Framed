"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function submit() {
    if (!password.trim() || loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/studio");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Access denied.");
        setShake(true);
        setPassword("");
        setTimeout(() => {
          setShake(false);
          inputRef.current?.focus();
        }, 400);
      }
    } catch {
      setError("Could not reach server.");
      setShake(true);
      setTimeout(() => setShake(false), 400);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") submit();
  }

  return (
    <div className="w-full max-w-xs px-6 flex flex-col items-center gap-0">
      {/* Wordmark */}
      <motion.div
        className="flex flex-col items-center w-full mb-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Top letterbox rule */}
        <div
          className="w-full mb-4"
          style={{ height: "1px", background: "var(--fr-line)" }}
        />

        <h1
          className="text-[2.75rem] tracking-[0.35em] font-normal select-none"
          style={{
            fontFamily: "var(--font-display), Georgia, serif",
            color: "var(--fr-ivory)",
            letterSpacing: "0.35em",
            textTransform: "uppercase",
          }}
        >
          Framed
        </h1>

        {/* Bottom letterbox rule */}
        <div
          className="w-full mt-4"
          style={{ height: "1px", background: "var(--fr-line)" }}
        />

        <p
          className="mt-5 text-[0.6875rem] tracking-[0.2em] uppercase"
          style={{ color: "var(--fr-muted)" }}
        >
          Cinematic reels
        </p>
      </motion.div>

      {/* Password field */}
      <motion.div
        className="w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
      >
        <motion.div
          animate={shake ? { x: [0, -5, 5, -4, 4, -2, 2, 0] } : { x: 0 }}
          transition={{ duration: 0.35 }}
          className="relative w-full"
        >
          <input
            ref={inputRef}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Password"
            autoComplete="current-password"
            autoFocus
            className="w-full bg-transparent py-3 text-sm outline-none transition-all duration-200"
            style={{
              color: "var(--fr-ivory)",
              borderBottom: "1px solid var(--fr-line)",
              caretColor: "var(--fr-gold)",
              letterSpacing: "0.08em",
              textAlign: "center",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderBottomColor = "var(--fr-gold)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderBottomColor = "var(--fr-line)";
            }}
          />
        </motion.div>

        {/* Error */}
        <motion.p
          animate={{ opacity: error ? 1 : 0, y: error ? 0 : -4 }}
          transition={{ duration: 0.2 }}
          className="mt-3 text-[0.6875rem] text-center tracking-wider"
          style={{ color: "var(--fr-muted)" }}
          aria-live="polite"
        >
          {error || " "}
        </motion.p>

        {/* Submit hint */}
        {!error && (
          <p
            className="mt-3 text-[0.625rem] tracking-[0.15em] uppercase text-center"
            style={{ color: "var(--fr-line)", opacity: password ? 1 : 0, transition: "opacity 0.2s" }}
          >
            Press Enter
          </p>
        )}
      </motion.div>

      {/* Loading indicator */}
      {loading && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          className="absolute bottom-0 left-0 h-px w-full origin-left"
          style={{ background: "var(--fr-gold)" }}
          transition={{ duration: 0.6 }}
        />
      )}
    </div>
  );
}
