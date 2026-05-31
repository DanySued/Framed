'use client';

import { useRef } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TextOverlay, useWizard } from '../WizardContext';
import { StepNav } from './StepNav';

const PREVIEW_FONT: Record<string, React.CSSProperties> = {
  sans: {},
  serif: { fontFamily: 'Georgia, serif' },
  mono: { fontFamily: 'monospace' },
};

function TextOverlayPreview({
  overlays,
  selectedId,
  onSelect,
  onPositionChange,
}: {
  overlays: TextOverlay[];
  selectedId: string;
  onSelect: (id: string) => void;
  onPositionChange: (id: string, pos: { x: number; y: number }) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<string | null>(null);
  const clamp = (v: number) => Math.max(5, Math.min(95, v));

  const posFromClient = (clientX: number, clientY: number) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return {
      x: clamp(((clientX - rect.left) / rect.width) * 100),
      y: clamp(((clientY - rect.top) / rect.height) * 100),
    };
  };

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl overflow-hidden border border-border select-none shrink-0"
      style={{
        width: '160px',
        aspectRatio: '9 / 16',
        background: 'linear-gradient(160deg, #27272a 0%, #18181b 50%, #09090b 100%)',
      }}
      onMouseMove={(e) => { if (dragging.current) onPositionChange(dragging.current, posFromClient(e.clientX, e.clientY)); }}
      onMouseUp={() => { dragging.current = null; }}
      onMouseLeave={() => { dragging.current = null; }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, white 2px, white 3px)' }}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center">
          <div className="w-0 h-0 border-y-[6px] border-y-transparent border-l-[10px] border-l-white/15 ml-1" />
        </div>
      </div>
      <p className="absolute bottom-2 inset-x-0 text-center text-[8px] text-white/25 pointer-events-none">drag to reposition</p>

      {overlays.map((ov) => {
        const display = ov.text || (overlays.length === 1 ? 'Your text here' : '');
        if (!display) return null;
        const isSelected = ov.id === selectedId;
        return (
          <div
            key={ov.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-10 cursor-grab active:cursor-grabbing"
            style={{ left: `${ov.x}%`, top: `${ov.y}%` }}
            onMouseDown={(e) => { e.preventDefault(); dragging.current = ov.id; onSelect(ov.id); }}
            onTouchStart={(e) => { e.preventDefault(); dragging.current = ov.id; onSelect(ov.id); }}
            onTouchMove={(e) => {
              if (dragging.current !== ov.id) return;
              const t = e.touches[0];
              onPositionChange(ov.id, posFromClient(t.clientX, t.clientY));
            }}
            onTouchEnd={() => { dragging.current = null; }}
          >
            <span
              className={cn(
                'block px-2 py-0.5 rounded text-[10px] shadow-lg max-w-[130px] truncate text-center text-white',
                ov.text ? 'bg-black/60' : 'bg-black/30 opacity-40',
                isSelected ? 'ring-1 ring-primary' : 'border border-white/15',
                ov.bold && 'font-bold',
                ov.italic && 'italic'
              )}
              style={PREVIEW_FONT[ov.font] ?? {}}
            >
              {display}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function TextStep() {
  const {
    overlays, setOverlays,
    noText, setNoText,
    selectedOverlayId, setSelectedOverlayId,
    nextOverlayIdRef,
    goNext,
  } = useWizard();

  const addOverlay = () => {
    const id = String(nextOverlayIdRef.current++);
    setOverlays((prev) => [...prev, { id, text: '', x: 50, y: 50, font: 'sans', bold: false, italic: false }]);
    setSelectedOverlayId(id);
  };

  const removeOverlay = (id: string) => {
    setOverlays((prev) => {
      const next = prev.filter((o) => o.id !== id);
      if (selectedOverlayId === id) setSelectedOverlayId(next[0]?.id ?? '');
      return next;
    });
  };

  const updateOverlay = (id: string, patch: Partial<TextOverlay>) => {
    setOverlays((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  };

  const selectedOverlay = overlays.find((o) => o.id === selectedOverlayId) ?? null;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Text overlay</h1>
          <p className="text-sm text-muted-foreground mt-1">Add text on top of your reel — optional.</p>
        </div>
        <button
          onClick={() => setNoText(!noText)}
          className={cn(
            'relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none shrink-0 mt-1',
            !noText ? 'bg-primary' : 'bg-secondary border border-border'
          )}
          aria-label="Toggle text overlay"
        >
          <span className={cn('absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200', !noText ? 'translate-x-5' : 'translate-x-0')} />
        </button>
      </div>

      {!noText ? (
        <div className="flex gap-4 items-start bg-secondary/50 rounded-xl border border-border p-4">
          <div className="flex-1 min-w-0 space-y-2">
            {overlays.map((ov) => (
              <div
                key={ov.id}
                onClick={() => setSelectedOverlayId(ov.id)}
                className={cn(
                  'flex items-center gap-1.5 p-2 rounded-xl border cursor-pointer transition-all',
                  selectedOverlayId === ov.id
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border bg-secondary hover:border-border/80'
                )}
              >
                <select
                  value={ov.font}
                  onChange={(e) => updateOverlay(ov.id, { font: e.target.value as TextOverlay['font'] })}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs bg-secondary border border-border rounded-lg px-1.5 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 shrink-0"
                >
                  <option value="sans">Sans</option>
                  <option value="serif">Serif</option>
                  <option value="mono">Mono</option>
                </select>

                <button
                  onClick={(e) => { e.stopPropagation(); updateOverlay(ov.id, { bold: !ov.bold }); }}
                  className={cn('w-6 h-6 rounded text-xs font-bold shrink-0 transition-colors', ov.bold ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-secondary border border-border text-muted-foreground hover:text-foreground')}
                >B</button>

                <button
                  onClick={(e) => { e.stopPropagation(); updateOverlay(ov.id, { italic: !ov.italic }); }}
                  className={cn('w-6 h-6 rounded text-xs italic shrink-0 transition-colors', ov.italic ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-secondary border border-border text-muted-foreground hover:text-foreground')}
                >I</button>

                <input
                  type="text"
                  value={ov.text}
                  onChange={(e) => updateOverlay(ov.id, { text: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Add text…"
                  className="flex-1 min-w-0 px-2 py-1 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                />

                {overlays.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeOverlay(ov.id); }}
                    className="text-muted-foreground hover:text-destructive transition-colors p-0.5 shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}

            <button
              onClick={addOverlay}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add text layer
            </button>

            {selectedOverlay && (
              <p className="text-xs text-muted-foreground">
                Position:{' '}
                <span className="text-foreground tabular-nums">
                  {Math.round(selectedOverlay.x)}% left · {Math.round(selectedOverlay.y)}% top
                </span>
              </p>
            )}
          </div>

          <TextOverlayPreview
            overlays={overlays}
            selectedId={selectedOverlayId}
            onSelect={setSelectedOverlayId}
            onPositionChange={(id, pos) => updateOverlay(id, pos)}
          />
        </div>
      ) : (
        <p className="text-xs text-muted-foreground bg-secondary/50 rounded-xl border border-border px-4 py-3">
          No text will be added to the reel.
        </p>
      )}

      <StepNav
        onNext={goNext}
        nextLabel="Next →"
        showSkip={noText}
        onSkip={goNext}
      />
    </div>
  );
}
