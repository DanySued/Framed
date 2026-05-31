'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { Film, ArrowRight } from 'lucide-react';

const FEATURES = [
  {
    title: 'Audio-first',
    description:
      'Upload your track and Framed builds the reel around it — timing, cuts, and rhythm all handled automatically.',
  },
  {
    title: 'Smart captions',
    description:
      'Keyword extraction turns your audio into punchy on-screen text. Edit or regenerate any line instantly.',
  },
  {
    title: 'Background render',
    description:
      'Kick off a render and keep working. Framed processes in the background and notifies you when it\'s ready.',
  },
  {
    title: 'Step-by-step',
    description:
      'Five focused steps take you from raw audio to a finished reel in minutes, no timeline headaches.',
  },
];

const STEPS = [
  { number: '01', label: 'Upload audio', description: 'Drop in your track or record directly.' },
  { number: '02', label: 'Generate keywords', description: 'AI picks the best moments for on-screen text.' },
  { number: '03', label: 'Tune settings', description: 'Choose style, ratio, and visual options.' },
  { number: '04', label: 'Review text', description: 'Edit captions before they are baked in.' },
  { number: '05', label: 'Export', description: 'Render in the background, download instantly.' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

export default function LandingPage() {
  const shouldReduce = useReducedMotion();

  return (
    <div className="min-h-screen bg-fr-black text-fr-text overflow-x-hidden">

      {/* ── Nav ── */}
      <header className="fixed top-0 inset-x-0 z-50 h-14 flex items-center px-6 border-b border-border/60 backdrop-blur-md" style={{ backgroundColor: 'color-mix(in srgb, var(--fr-surface) 85%, transparent)' }}>
        <div className="absolute inset-x-0 top-0 h-px pointer-events-none" style={{ background: 'linear-gradient(to right, transparent, color-mix(in srgb, var(--fr-gold) 35%, transparent), transparent)' }} />
        <div className="fr-container w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg ring-1 ring-primary/30 transition-all group-hover:ring-primary/55" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--fr-gold) 20%, transparent), color-mix(in srgb, var(--fr-gold) 5%, transparent))' }}>
              <Film className="w-3.5 h-3.5 text-primary" />
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
      <section className="relative min-h-screen flex items-center pt-14">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/3 w-[600px] h-[350px] rounded-full blur-[160px]" style={{ backgroundColor: 'color-mix(in srgb, var(--fr-gold) 5%, transparent)' }} />
        </div>

        <div className="fr-container relative z-10 py-28 sm:py-36">
          <div className="max-w-3xl">
            <motion.h1
              variants={fadeUp}
              initial={shouldReduce ? 'show' : 'hidden'}
              animate="show"
              custom={0}
              className="text-5xl sm:text-6xl lg:text-7xl leading-[1.02] tracking-tight mb-6"
              style={{ fontFamily: 'var(--font-instrument-serif), Georgia, serif', color: 'var(--fr-white)' }}
            >
              Audio in.<br />
              <span className="italic" style={{ color: 'var(--fr-gold)' }}>Reel out.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial={shouldReduce ? 'show' : 'hidden'}
              animate="show"
              custom={1}
              className="max-w-lg text-lg leading-relaxed mb-10"
              style={{ color: 'var(--fr-text-muted)' }}
            >
              Upload your track and Framed produces a fully captioned video reel — timing, captions, and export handled automatically.
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial={shouldReduce ? 'show' : 'hidden'}
              animate="show"
              custom={2}
            >
              <Link
                href="/reels"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
              >
                Start creating
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="fr-section border-t border-border/60">
        <div className="fr-container">
          <div className="grid sm:grid-cols-2 gap-x-12 gap-y-10">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                initial={shouldReduce ? 'show' : 'hidden'}
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
                custom={i}
              >
                <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--fr-gold)' }}>{String(i + 1).padStart(2, '0')}</p>
                <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--fr-white)' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--fr-text-muted)' }}>{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="fr-section border-t border-border/60">
        <div className="fr-container">
          <div className="max-w-xl">
            <motion.h2
              variants={fadeUp}
              initial={shouldReduce ? 'show' : 'hidden'}
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
              className="text-3xl sm:text-4xl font-normal tracking-tight mb-12"
              style={{ fontFamily: 'var(--font-instrument-serif), Georgia, serif', color: 'var(--fr-white)' }}
            >
              Five steps,<br />one great reel.
            </motion.h2>

            <div className="space-y-8">
              {STEPS.map((step, i) => (
                <motion.div
                  key={step.number}
                  variants={fadeUp}
                  initial={shouldReduce ? 'show' : 'hidden'}
                  whileInView="show"
                  viewport={{ once: true, amount: 0.4 }}
                  custom={i}
                  className="flex gap-6 items-baseline"
                >
                  <span
                    className="shrink-0 tabular-nums select-none"
                    style={{
                      fontFamily: 'var(--font-instrument-serif), Georgia, serif',
                      fontSize: '1.5rem',
                      lineHeight: 1,
                      color: 'var(--fr-gold)',
                      opacity: 0.5,
                    }}
                  >
                    {step.number}
                  </span>
                  <div>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--fr-white)' }}>{step.label}</p>
                    <p className="text-sm" style={{ color: 'var(--fr-text-muted)' }}>{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="fr-section border-t border-border/60">
        <div className="fr-container">
          <motion.div
            variants={fadeUp}
            initial={shouldReduce ? 'show' : 'hidden'}
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
          >
            <h2
              className="text-3xl sm:text-4xl font-normal tracking-tight mb-4"
              style={{ fontFamily: 'var(--font-instrument-serif), Georgia, serif', color: 'var(--fr-white)' }}
            >
              Ready to make your first reel?
            </h2>
            <p className="max-w-md leading-relaxed mb-8" style={{ color: 'var(--fr-text-muted)' }}>
              Drop in your audio and Framed handles the rest — captions, timing, and export in the background.
            </p>
            <Link
              href="/reels"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
            >
              Open Framed
              <ArrowRight className="w-3.5 h-3.5" />
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
