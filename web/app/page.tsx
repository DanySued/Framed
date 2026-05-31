'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import {
  Film,
  Wand2,
  Music2,
  Type,
  Zap,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Music2,
    title: 'Audio-first workflow',
    description:
      'Upload your audio track and let Framed build the reel around it — timing, cuts, and rhythm all handled automatically.',
  },
  {
    icon: Type,
    title: 'AI-generated captions',
    description:
      'Smart keyword extraction turns your audio into punchy on-screen text. Edit or regenerate any line instantly.',
  },
  {
    icon: Wand2,
    title: 'Guided step-by-step wizard',
    description:
      'Five focused steps take you from raw audio to a finished reel in minutes, with no timeline headaches.',
  },
  {
    icon: Zap,
    title: 'Background generation',
    description:
      'Kick off a render and keep working. Framed processes your reel in the background and notifies you when it is ready.',
  },
];

const STEPS = [
  { number: '01', label: 'Upload audio', description: 'Drop in your track or record directly.' },
  { number: '02', label: 'Generate keywords', description: 'AI picks the best moments for on-screen text.' },
  { number: '03', label: 'Tune settings', description: 'Choose style, ratio, and visual options.' },
  { number: '04', label: 'Review text', description: 'Edit captions before they are baked in.' },
  { number: '05', label: 'Export reel', description: 'Render in the background, download instantly.' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

export default function LandingPage() {
  const shouldReduce = useReducedMotion();

  return (
    <div className="min-h-screen bg-fr-black text-fr-text overflow-x-hidden">
      {/* ── Nav ── */}
      <header className="fixed top-0 inset-x-0 z-50 h-14 flex items-center px-6 border-b border-border/60 backdrop-blur-md" style={{ backgroundColor: 'color-mix(in srgb, var(--fr-surface) 85%, transparent)' }}>
        {/* Gold shimmer top */}
        <div className="absolute inset-x-0 top-0 h-px pointer-events-none" style={{ background: 'linear-gradient(to right, transparent, color-mix(in srgb, var(--fr-gold) 40%, transparent), transparent)' }} />
        <div className="fr-container w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg ring-1 ring-primary/30 transition-all group-hover:ring-primary/55" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--fr-gold) 20%, transparent), color-mix(in srgb, var(--fr-gold) 5%, transparent))' }}>
              <Film className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-semibold tracking-tight transition-colors group-hover:text-primary" style={{ color: 'var(--fr-white)' }}>Framed</span>
          </Link>
          <Link
            href="/reels"
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:brightness-110 transition-all"
          >
            Open app <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center pt-14">
        {/* Background glows — amber/gold cinematic */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[140px]" style={{ backgroundColor: 'color-mix(in srgb, var(--fr-gold) 6%, transparent)' }} />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[250px] rounded-full blur-[120px]" style={{ backgroundColor: 'color-mix(in srgb, var(--fr-gold) 4%, transparent)' }} />
        </div>
        {/* Film strip edge decorations */}
        <div className="absolute left-0 top-0 bottom-0 w-8 pointer-events-none opacity-[0.035]"
          style={{ backgroundImage: 'repeating-linear-gradient(180deg, transparent, transparent 20px, white 20px, white 22px, transparent 22px, transparent 36px, white 36px, white 38px)' }} />
        <div className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none opacity-[0.035]"
          style={{ backgroundImage: 'repeating-linear-gradient(180deg, transparent, transparent 20px, white 20px, white 22px, transparent 22px, transparent 36px, white 36px, white 38px)' }} />

        <div className="fr-container relative z-10 text-center py-24 sm:py-32">
          {/* Badge */}
          <motion.div
            variants={fadeUp}
            initial={shouldReduce ? 'show' : 'hidden'}
            animate="show"
            custom={0}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass text-xs font-semibold tracking-wide text-primary mb-8 uppercase"
            style={{ letterSpacing: '0.06em' }}
          >
            <Sparkles className="w-3 h-3" />
            AI-powered reels creation
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            initial={shouldReduce ? 'show' : 'hidden'}
            animate="show"
            custom={1}
            className="text-5xl sm:text-6xl lg:text-7xl leading-[1.02] tracking-tight mb-6"
            style={{ fontFamily: 'var(--font-instrument-serif), Georgia, serif', color: 'var(--fr-white)' }}
          >
            Turn audio into<br />
            <span className="gradient-text italic">scroll-stopping</span> reels
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={fadeUp}
            initial={shouldReduce ? 'show' : 'hidden'}
            animate="show"
            custom={2}
            className="max-w-xl mx-auto text-lg leading-relaxed mb-10"
            style={{ color: 'var(--fr-text-muted)' }}
          >
            Framed takes your audio and produces a fully captioned video reel in minutes — no editing
            experience needed, no timeline to wrestle with.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp}
            initial={shouldReduce ? 'show' : 'hidden'}
            animate="show"
            custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link
              href="/reels"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 hover:brightness-110 transition-all"
            >
              <Film className="w-4 h-4" />
              Start creating
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass text-sm font-medium hover:bg-white/[0.08] transition-all"
              style={{ color: 'var(--fr-text)' }}
            >
              See how it works
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="fp-section border-t border-border/60">
        <div className="fr-container">
          {/* Section heading */}
          <motion.div
            variants={fadeUp}
            initial={shouldReduce ? 'show' : 'hidden'}
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-14"
          >
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] mb-3" style={{ color: 'var(--fr-gold)' }}>Features</p>
            <h2 className="text-3xl sm:text-4xl font-normal tracking-tight" style={{ fontFamily: 'var(--font-instrument-serif), Georgia, serif', color: 'var(--fr-white)' }}>
              Everything you need to ship reels fast
            </h2>
          </motion.div>

          {/* Feature cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                initial={shouldReduce ? 'show' : 'hidden'}
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
                custom={i}
                className="glass rounded-2xl p-6 flex flex-col gap-4 hover:bg-white/[0.06] transition-colors"
              >
                <div className="w-10 h-10 rounded-xl ring-1 ring-primary/25 flex items-center justify-center shrink-0" style={{ backgroundColor: 'color-mix(in srgb, var(--fr-gold) 10%, transparent)' }}>
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-1.5" style={{ color: 'var(--fr-white)' }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--fr-text-muted)' }}>{f.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="fp-section border-t border-border/60">
        <div className="fr-container">
          <motion.div
            variants={fadeUp}
            initial={shouldReduce ? 'show' : 'hidden'}
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-14"
          >
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] mb-3" style={{ color: 'var(--fr-gold)' }}>How it works</p>
            <h2 className="text-3xl sm:text-4xl font-normal tracking-tight" style={{ fontFamily: 'var(--font-instrument-serif), Georgia, serif', color: 'var(--fr-white)' }}>
              Five steps, one great reel
            </h2>
          </motion.div>

          <div className="max-w-2xl mx-auto space-y-0">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.number}
                variants={fadeUp}
                initial={shouldReduce ? 'show' : 'hidden'}
                whileInView="show"
                viewport={{ once: true, amount: 0.4 }}
                custom={i}
                className="flex gap-6 relative"
              >
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="absolute left-[18px] top-10 bottom-0 w-px bg-border/50" />
                )}

                {/* Step indicator */}
                <div className="shrink-0 w-9 h-9 rounded-full glass ring-1 ring-primary/25 flex items-center justify-center text-xs font-semibold text-primary z-10">
                  {step.number}
                </div>

                {/* Content */}
                <div className="pb-10">
                  <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--fr-white)' }}>{step.label}</p>
                  <p className="text-sm" style={{ color: 'var(--fr-text-muted)' }}>{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="fp-section border-t border-border/60">
        <div className="fr-container">
          <motion.div
            variants={fadeUp}
            initial={shouldReduce ? 'show' : 'hidden'}
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            className="max-w-2xl mx-auto text-center glass rounded-3xl p-12"
            style={{ boxShadow: '0 0 60px rgba(212,168,75,0.08)' }}
          >
            <div className="w-14 h-14 rounded-2xl ring-1 ring-primary/35 flex items-center justify-center mx-auto mb-6 animate-float" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--fr-gold) 30%, transparent), color-mix(in srgb, var(--fr-gold) 8%, transparent))' }}>
              <Film className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-normal tracking-tight mb-4" style={{ fontFamily: 'var(--font-instrument-serif), Georgia, serif', color: 'var(--fr-white)' }}>
              Ready to make your first reel?
            </h2>
            <p className="leading-relaxed mb-8" style={{ color: 'var(--fr-text-muted)' }}>
              Drop in your audio and Framed will handle the rest — captions, timing, and export,
              all in the background while you do other things.
            </p>
            <Link
              href="/reels"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 hover:brightness-110 transition-all"
            >
              <Film className="w-4 h-4" />
              Open Framed
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/60 py-8">
        <div className="fr-container flex flex-col sm:flex-row items-center justify-between gap-4 text-xs" style={{ color: 'var(--fr-text-muted)' }}>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-md ring-1 ring-primary/25" style={{ backgroundColor: 'color-mix(in srgb, var(--fr-gold) 12%, transparent)' }}>
              <Film className="w-3 h-3 text-primary" />
            </div>
            <span className="font-semibold" style={{ color: 'var(--fr-white)' }}>Framed</span>
          </div>
          <p>Private access only &middot; Your data stays yours</p>
        </div>
      </footer>
    </div>
  );
}
