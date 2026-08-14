'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface SuccessData {
  imageUrls: string[];
  priceType: string;
  sessionId: string;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [data, setData] = useState<SuccessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [downloading, setDownloading] = useState<number | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID found. Please contact support.');
      setLoading(false);
      return;
    }

    const fetchDetails = async () => {
      try {
        const res = await fetch(`/api/success-details?session_id=${sessionId}`);

        if (res.status === 202) {
          // Prediction still processing — retry
          setTimeout(fetchDetails, 4000);
          return;
        }

        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error || 'Failed to load your headshots');
        }

        const body = await res.json();
        setData(body);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [sessionId]);

  const handleDownload = async (index: number) => {
    if (!sessionId) return;
    setDownloading(index);
    try {
      const url = `/api/download?session_id=${sessionId}&index=${index}`;
      const a = document.createElement('a');
      a.href = url;
      a.download = `professional-headshot-${index + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setTimeout(() => setDownloading(null), 1500);
    }
  };

  const handleDownloadAll = async () => {
    if (!data || !sessionId) return;
    for (let i = 0; i < data.imageUrls.length; i++) {
      await new Promise<void>((resolve) => {
        setTimeout(async () => {
          await handleDownload(i);
          resolve();
        }, i * 800);
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: 'var(--bg)' }}>
      {/* Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-15"
          style={{ background: 'radial-gradient(ellipse, #6c63ff 0%, transparent 70%)' }} />
      </div>

      <div className="relative w-full max-w-xl space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl"
            style={{ background: 'linear-gradient(135deg, #6c63ff22, #a855f722)', border: '1px solid rgba(108,99,255,0.4)' }}>
            {loading ? '⏳' : error ? '😕' : '🎉'}
          </div>
          <h1 className="text-3xl font-extrabold text-white">
            {loading ? 'Loading your headshots…' : error ? 'Something went wrong' : 'Payment successful!'}
          </h1>
          {!error && !loading && (
            <p className="text-gray-400">
              {data?.priceType === 'subscription'
                ? '🎁 You now have unlimited monthly headshot sessions!'
                : 'Your 4 HD headshots are ready to download below.'}
            </p>
          )}
        </div>

        {loading && (
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-400 text-sm">Retrieving your images…</p>
          </div>
        )}

        {error && (
          <div className="glass-card rounded-2xl p-8 text-center space-y-4">
            <p className="text-red-400 text-sm">{error}</p>
            <p className="text-gray-500 text-xs">
              If you were charged, email us at{' '}
              <a href="mailto:support@headshotai.app" className="text-purple-400 underline">
                support@headshotai.app
              </a>{' '}
              with your session ID: <code className="text-gray-400">{sessionId}</code>
            </p>
            <a href="/" className="inline-block btn-primary px-6 py-3 rounded-xl text-white font-semibold">
              Try again
            </a>
          </div>
        )}

        {data && !loading && !error && (
          <>
            {/* Image grid */}
            <div className="grid grid-cols-2 gap-3">
              {data.imageUrls.slice(0, 4).map((url, i) => (
                <div key={i} className="relative group rounded-xl overflow-hidden aspect-square glass-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`HD Headshot ${i + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => handleDownload(i)}
                      disabled={downloading !== null}
                      className="btn-primary px-4 py-2 rounded-lg text-sm font-semibold text-white"
                    >
                      {downloading === i ? '↓ Downloading…' : '↓ Download'}
                    </button>
                  </div>
                  <div className="absolute top-2 left-2 bg-black/60 rounded-full px-2 py-0.5 text-xs text-white">
                    HD #{i + 1}
                  </div>
                </div>
              ))}
            </div>

            {/* Download all button */}
            <button
              onClick={handleDownloadAll}
              disabled={downloading !== null}
              className="btn-primary w-full py-4 rounded-2xl font-bold text-white text-lg shadow-lg shadow-purple-900/30"
            >
              {downloading !== null ? '↓ Downloading all…' : '↓ Download All 4 HD Photos'}
            </button>

            {/* Usage tips */}
            <div className="glass-card rounded-2xl p-5 space-y-2">
              <p className="text-white text-sm font-semibold">🚀 Where to use your headshots</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                {['LinkedIn profile', 'Email signature', 'CV / Résumé', 'Company website', 'Speaker bios', 'Press kit'].map(u => (
                  <span key={u} className="flex items-center gap-1"><span className="text-purple-400">✓</span> {u}</span>
                ))}
              </div>
            </div>

            {/* Back link */}
            <p className="text-center text-sm text-gray-600">
              Want more styles?{' '}
              <a href="/" className="text-purple-400 hover:text-purple-300 underline">
                Generate another session
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
