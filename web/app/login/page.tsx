'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Film, Loader2 } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

function LoginForm() {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || loading) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Invalid password');
        return;
      }
      router.push(searchParams.get('next') || '/reels');
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[0.6875rem] font-semibold text-muted-foreground mb-1.5 tracking-[0.08em] uppercase">
          Password
        </label>
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoFocus
            autoComplete="current-password"
            className="w-full px-3.5 py-2.5 bg-fr-surface-2 border border-fr-border rounded-xl text-fr-text text-sm placeholder:text-fr-text-muted/50 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 pr-10 transition-all duration-150"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-fr-text-muted hover:text-fr-text transition-colors"
          >
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: '0.5rem' }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="text-xs text-fr-red bg-fr-red/10 border border-fr-red/25 rounded-lg px-3 py-2 overflow-hidden"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.button
        type="submit"
        whileTap={{ scale: 0.97 }}
        disabled={loading || !password}
        className="w-full py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-primary-foreground rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/25"
      >
        {loading && <Loader2 size={15} className="animate-spin" />}
        {loading ? 'Signing in…' : 'Sign in'}
      </motion.button>
    </form>
  );
}

export default function LoginPage() {
  const shouldReduce = useReducedMotion();

  return (
    <div className="min-h-screen bg-fr-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs — cinematic amber glow */}
      <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[700px] h-[320px] bg-primary/6 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-40px] right-1/4 w-[450px] h-[220px] bg-primary/4 blur-[110px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: shouldReduce ? 0 : -12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          className="flex flex-col items-center mb-9"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/25 to-primary/5 ring-1 ring-primary/35 flex items-center justify-center mb-4 shadow-2xl shadow-primary/20">
            <Film className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-normal text-fr-white tracking-tight" style={{ fontFamily: 'var(--font-instrument-serif), Georgia, serif' }}>
            Framed
          </h1>
          <p className="text-sm text-fr-text-muted mt-1.5">Your personal reels creation tool</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduce ? 0 : 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="glass rounded-2xl p-6 shadow-2xl shadow-black/50"
        >
          <div className="mb-5">
            <h2 className="text-base font-semibold text-fr-white">Welcome back</h2>
            <p className="text-xs text-fr-text-muted mt-0.5">Enter your password to access Framed</p>
          </div>
          <Suspense>
            <LoginForm />
          </Suspense>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.32 }}
          className="text-center text-xs text-fr-text-dim mt-5"
        >
          Private access only · Your data stays yours
        </motion.p>
      </div>
    </div>
  );
}
