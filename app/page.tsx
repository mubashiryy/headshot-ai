'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Stage = 'upload' | 'generating' | 'results' | 'error';
type StyleKey = 'corporate' | 'linkedin' | 'executive' | 'casual';

interface Result {
  predictionId: string;
  imageUrls: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STYLES: { key: StyleKey; label: string; desc: string; icon: string }[] = [
  { key: 'corporate', label: 'Corporate', desc: 'Formal suit, neutral bg', icon: '🏢' },
  { key: 'linkedin', label: 'LinkedIn', desc: 'Business casual, blue bg', icon: '💼' },
  { key: 'executive', label: 'Executive', desc: 'C-suite, office setting', icon: '⭐' },
  { key: 'casual', label: 'Smart Casual', desc: 'Approachable, warm bg', icon: '✨' },
];

const PROGRESS_MESSAGES = [
  { pct: 0, msg: 'Uploading your photo…' },
  { pct: 12, msg: 'Analysing facial features…' },
  { pct: 30, msg: 'Applying professional style…' },
  { pct: 55, msg: 'Generating headshots…' },
  { pct: 80, msg: 'Applying finishing touches…' },
  { pct: 95, msg: 'Almost there…' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getProgressMsg(pct: number): string {
  let msg = PROGRESS_MESSAGES[0].msg;
  for (const p of PROGRESS_MESSAGES) {
    if (pct >= p.pct) msg = p.msg;
  }
  return msg;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function UploadZone({
  onFile,
  previewUrl,
}: {
  onFile: (f: File) => void;
  previewUrl: string | null;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) onFile(file);
    },
    [onFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  };

  return (
    <div
      className={`upload-zone rounded-2xl p-8 text-center cursor-pointer select-none transition-all ${dragging ? 'drag-over' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />

      {previewUrl ? (
        <div className="flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Preview"
            className="w-36 h-36 object-cover rounded-full border-4 border-purple-500 shadow-lg shadow-purple-900/40"
          />
          <p className="text-purple-300 text-sm font-medium">Tap to change photo</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-purple-900/30 flex items-center justify-center">
            <svg className="w-10 h-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.338-2.32 5.75 5.75 0 0 1 1.154 11.094" />
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold text-lg">Drop your selfie here</p>
            <p className="text-gray-400 text-sm mt-1">or click to browse · JPEG, PNG, WebP · max 10MB</p>
          </div>
          <div className="flex gap-2 text-xs text-gray-500">
            <span className="glass-card px-3 py-1 rounded-full">Face clearly visible</span>
            <span className="glass-card px-3 py-1 rounded-full">Good lighting</span>
            <span className="glass-card px-3 py-1 rounded-full">Recent photo</span>
          </div>
        </div>
      )}
    </div>
  );
}

function GeneratingView({ progress }: { progress: number }) {
  return (
    <div className="flex flex-col items-center gap-8 py-12 animate-fade-in">
      {/* Spinning ring */}
      <div className="relative w-32 h-32">
        <div className="absolute inset-0 rounded-full border-4 border-purple-900/40" />
        <div
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 border-r-purple-400 animate-spin"
          style={{ animationDuration: '1.2s' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold gradient-text">{progress}%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-sm">
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #6c63ff, #a855f7)',
            }}
          />
        </div>
        <p className="text-center text-gray-400 text-sm mt-3">{getProgressMsg(progress)}</p>
      </div>

      <div className="glass-card rounded-xl px-6 py-4 text-center max-w-sm">
        <p className="text-gray-300 text-sm">
          ⚡ AI is generating 4 professional headshots for you.<br />
          <span className="text-gray-500">This usually takes 30–90 seconds.</span>
        </p>
      </div>
    </div>
  );
}

function ResultGrid({
  imageUrls,
  predictionId,
  onCheckout,
}: {
  imageUrls: string[];
  predictionId: string;
  onCheckout: (type: 'one_time' | 'subscription') => void;
}) {
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);

  const handleCheckout = async (type: 'one_time' | 'subscription') => {
    setLoadingCheckout(type);
    onCheckout(type);
  };

  return (
    <div className="animate-fade-in space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">Your headshots are ready! 🎉</h2>
        <p className="text-gray-400 mt-1 text-sm">
          Free preview (watermarked) · Unlock HD without watermark below
        </p>
      </div>

      {/* 2×2 image grid */}
      <div className="grid grid-cols-2 gap-3">
        {imageUrls.slice(0, 4).map((url, i) => (
          <div key={i} className="relative rounded-xl overflow-hidden aspect-square glass-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/watermark?url=${encodeURIComponent(url)}`}
              alt={`Headshot ${i + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute top-2 left-2 bg-black/60 rounded-full px-2 py-0.5 text-xs text-white">
              Style {i + 1}
            </div>
          </div>
        ))}
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* One-time */}
        <div className="glass-card rounded-2xl p-5 flex flex-col gap-4 hover:border-purple-500/40 transition-colors">
          <div>
            <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">One-time</div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-white">$19</span>
              <span className="text-gray-400 text-sm">once</span>
            </div>
            <p className="text-gray-400 text-sm mt-2">
              Download all 4 HD headshots from this session, no watermark.
            </p>
          </div>
          <ul className="space-y-1.5 text-sm text-gray-300 flex-1">
            {['4 HD headshots (this session)', 'No watermark', 'Instant download', 'Commercial use'].map(f => (
              <li key={f} className="flex items-center gap-2">
                <span className="text-purple-400">✓</span> {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => handleCheckout('one_time')}
            disabled={loadingCheckout !== null}
            className="btn-primary w-full py-3 rounded-xl font-semibold text-white"
          >
            {loadingCheckout === 'one_time' ? 'Redirecting…' : 'Download HD for $19'}
          </button>
        </div>

        {/* Subscription */}
        <div className="rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.15) 0%, rgba(168,85,247,0.12) 100%)', border: '1px solid rgba(108,99,255,0.35)' }}>
          <div className="absolute top-3 right-3 bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            BEST VALUE
          </div>
          <div>
            <div className="text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1">Monthly</div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-white">$12</span>
              <span className="text-gray-400 text-sm">/month</span>
            </div>
            <p className="text-gray-400 text-sm mt-2">
              Unlimited headshot sessions every month. Cancel anytime.
            </p>
          </div>
          <ul className="space-y-1.5 text-sm text-gray-300 flex-1">
            {['Unlimited sessions/month', 'All HD downloads', 'Priority generation', 'All future styles', 'Cancel anytime'].map(f => (
              <li key={f} className="flex items-center gap-2">
                <span className="text-purple-300">✓</span> {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => handleCheckout('subscription')}
            disabled={loadingCheckout !== null}
            className="btn-primary w-full py-3 rounded-xl font-semibold text-white"
          >
            {loadingCheckout === 'subscription' ? 'Redirecting…' : 'Subscribe for $12/mo'}
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-gray-600">
        Secure checkout via Stripe · Instant delivery · 30-day refund guarantee
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [stage, setStage] = useState<Stage>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [style, setStyle] = useState<StyleKey>('corporate');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string>('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const slowTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (pollRef.current) clearInterval(pollRef.current);
      if (slowTimerRef.current) clearInterval(slowTimerRef.current);
    };
  }, [previewUrl]);

  const handleFileSelect = useCallback((f: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setStage('upload');
    setResult(null);
    setError('');
  }, [previewUrl]);

  const handleGenerate = async () => {
    if (!file) return;
    setStage('generating');
    setProgress(5);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('style', style);

      const genRes = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      if (!genRes.ok) {
        const { error: msg } = await genRes.json();
        throw new Error(msg || 'Generation start failed');
      }

      const { predictionId } = await genRes.json();
      setProgress(12);

      // Slowly advance the displayed progress (55 → 90%) while the model runs,
      // so the bar never appears frozen. +1% every 5 s ≈ 2.9 min to reach 90%.
      let displayPct = 55;
      slowTimerRef.current = setInterval(() => {
        displayPct = Math.min(displayPct + 1, 90);
        setProgress(displayPct);
      }, 5000);

      // Timeout after 5 minutes
      let elapsed = 0;
      const MAX_WAIT_MS = 5 * 60 * 1000;

      // Poll for completion
      pollRef.current = setInterval(async () => {
        elapsed += 3500;
        if (elapsed >= MAX_WAIT_MS) {
          clearInterval(pollRef.current!);
          clearInterval(slowTimerRef.current!);
          setError('Generation timed out. Please try again.');
          setStage('error');
          return;
        }

        try {
          const statusRes = await fetch(`/api/status/${predictionId}`);
          const data = await statusRes.json();

          // Only drive progress from the API for non-processing states
          if (data.status === 'starting') setProgress(12);

          if (data.status === 'succeeded' && data.output?.length) {
            clearInterval(pollRef.current!);
            clearInterval(slowTimerRef.current!);
            setProgress(100);
            setTimeout(() => {
              setResult({ predictionId, imageUrls: data.output });
              setStage('results');
            }, 500);
          } else if (data.status === 'failed' || data.status === 'canceled') {
            clearInterval(pollRef.current!);
            clearInterval(slowTimerRef.current!);
            throw new Error(data.error || 'Generation failed. Please try again.');
          }
        } catch (pollErr) {
          if (pollRef.current) clearInterval(pollRef.current);
          if (slowTimerRef.current) clearInterval(slowTimerRef.current);
          setError(pollErr instanceof Error ? pollErr.message : 'Polling error');
          setStage('error');
        }
      }, 3500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStage('error');
    }
  };

  const handleCheckout = async (priceType: 'one_time' | 'subscription') => {
    if (!result) return;
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ predictionId: result.predictionId, priceType }),
      });

      if (!res.ok) throw new Error('Checkout creation failed');
      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Checkout failed');
    }
  };

  const handleReset = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (slowTimerRef.current) clearInterval(slowTimerRef.current);
    setStage('upload');
    setResult(null);
    setError('');
    setProgress(0);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#6c63ff,#a855f7)' }}>
            <span className="text-white font-bold text-sm">H</span>
          </div>
          <span className="font-bold text-white text-lg">HeadshotAI</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span className="hidden sm:inline">✓ 10,000+ professionals served</span>
          <a href="#pricing" className="text-purple-400 hover:text-purple-300 transition-colors">Pricing</a>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative flex-1 flex flex-col items-center justify-start px-4 pt-12 pb-6 overflow-hidden">
        {/* Glow blobs */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-20"
          style={{ background: 'radial-gradient(ellipse, #6c63ff 0%, transparent 70%)' }} />

        {stage === 'upload' && (
          <div className="w-full max-w-xl space-y-6 animate-fade-in">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 glass-card rounded-full px-4 py-1.5 text-sm text-purple-300 mb-2">
                <span>⚡</span>
                <span>Powered by PhotoMaker AI</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                Professional headshots
                <br />
                <span className="gradient-text">in minutes</span>
              </h1>
              <p className="text-gray-400 text-lg max-w-md mx-auto">
                Upload one selfie. Get 4 studio-quality headshots you&rsquo;d pay hundreds for.
              </p>
            </div>

            {/* Style picker */}
            <div>
              <p className="text-sm text-gray-500 mb-2 text-center">Choose your style</p>
              <div className="grid grid-cols-4 gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setStyle(s.key)}
                    className={`rounded-xl p-3 text-center transition-all text-sm glass-card ${style === s.key
                      ? 'border-purple-500 bg-purple-900/20 text-white'
                      : 'text-gray-400 hover:text-white hover:border-white/20'
                      }`}
                  >
                    <div className="text-xl mb-1">{s.icon}</div>
                    <div className="font-medium text-xs leading-tight">{s.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Upload zone */}
            <UploadZone onFile={handleFileSelect} previewUrl={previewUrl} />

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={!file}
              className="btn-primary w-full py-4 rounded-2xl font-bold text-white text-lg shadow-lg shadow-purple-900/30"
            >
              {file ? '✨ Generate My Headshots' : 'Upload a photo to continue'}
            </button>

            {/* Social proof */}
            <div className="flex items-center justify-center gap-6 text-xs text-gray-600">
              <span>🔒 Private &amp; secure</span>
              <span>⚡ ~60 sec</span>
              <span>💳 No card needed for free preview</span>
            </div>
          </div>
        )}

        {stage === 'generating' && (
          <div className="w-full max-w-xl">
            <GeneratingView progress={progress} />
          </div>
        )}

        {stage === 'results' && result && (
          <div className="w-full max-w-xl">
            <ResultGrid
              imageUrls={result.imageUrls}
              predictionId={result.predictionId}
              onCheckout={handleCheckout}
            />
            <button
              onClick={handleReset}
              className="mt-4 w-full py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              ← Generate with a different photo
            </button>
          </div>
        )}

        {stage === 'error' && (
          <div className="w-full max-w-xl animate-fade-in">
            <div className="glass-card rounded-2xl p-8 text-center space-y-4">
              <div className="text-4xl">😕</div>
              <h2 className="text-xl font-bold text-white">Something went wrong</h2>
              <p className="text-gray-400 text-sm">{error}</p>
              <button onClick={handleReset} className="btn-primary px-8 py-3 rounded-xl font-semibold text-white">
                Try again
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-center text-2xl font-bold text-white mb-10">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Upload a selfie', desc: 'Any recent photo with your face clearly visible. Phone camera quality works great.' },
              { step: '02', title: 'AI generates 4 headshots', desc: 'Our AI analyzes your features and renders professional studio-quality portraits in ~60 seconds.' },
              { step: '03', title: 'Download HD', desc: 'Pay once to download all 4 in full HD, no watermark. Ready for LinkedIn, CVs, and more.' },
            ].map((item) => (
              <div key={item.step} className="glass-card rounded-2xl p-6">
                <div className="text-3xl font-black gradient-text mb-3">{item.step}</div>
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing anchor ───────────────────────────────────────────────────── */}
      <section id="pricing" className="py-16 px-4 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">Simple pricing</h2>
          <p className="text-gray-400">Generate for free, pay only for HD downloads.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 text-left">
            <div className="glass-card rounded-2xl p-6">
              <div className="text-2xl font-bold text-white">Free</div>
              <p className="text-gray-400 text-sm mt-1">Always free</p>
              <ul className="mt-4 space-y-2 text-sm text-gray-300">
                {['4 watermarked previews', 'All styles', 'No account needed'].map(f => (
                  <li key={f} className="flex gap-2"><span className="text-gray-500">✓</span>{f}</li>
                ))}
              </ul>
            </div>
            <div className="glass-card rounded-2xl p-6" style={{ borderColor: 'rgba(108,99,255,0.4)' }}>
              <div className="text-2xl font-bold gradient-text">$19 / $12 mo</div>
              <p className="text-gray-400 text-sm mt-1">One-time or monthly</p>
              <ul className="mt-4 space-y-2 text-sm text-gray-300">
                {['4 HD headshots, no watermark', 'Unlimited monthly sessions', 'Commercial use', '30-day refund'].map(f => (
                  <li key={f} className="flex gap-2"><span className="text-purple-400">✓</span>{f}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="py-8 px-4 border-t border-white/5 text-center text-xs text-gray-600 space-y-1">
        <p>© {new Date().getFullYear()} HeadshotAI · Powered by PhotoMaker AI + Stripe</p>
        <p>Images processed securely · Deleted from servers after 24 hours</p>
      </footer>
    </div>
  );
}
