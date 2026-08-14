import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Missing prediction ID' }, { status: 400 });
    }

    // Support comma-separated IDs for multiple parallel predictions
    const ids = id.split(',').filter(Boolean);

    const predictions = await Promise.all(ids.map((pid) => replicate.predictions.get(pid)));

    // Determine combined status
    const statuses = predictions.map((p) => p.status);
    const hasFailed = statuses.some((s) => s === 'failed' || s === 'canceled');
    const allSucceeded = statuses.every((s) => s === 'succeeded');
    const anyProcessing = statuses.some((s) => s === 'processing');
    const anyStarting = statuses.some((s) => s === 'starting');

    let combinedStatus: string;
    if (hasFailed) {
      combinedStatus = 'failed';
    } else if (allSucceeded) {
      combinedStatus = 'succeeded';
    } else if (anyProcessing) {
      combinedStatus = 'processing';
    } else {
      combinedStatus = 'starting';
    }

    const progressMap: Record<string, number> = {
      starting: 12,
      processing: 55,
      succeeded: 100,
      failed: 0,
      canceled: 0,
    };

    // Collect all outputs — FLUX returns a single URL string per prediction
    const outputs: string[] = predictions.flatMap((p) => {
      if (!p.output) return [];
      // FLUX returns a string URL; PhotoMaker returned string[]
      if (typeof p.output === 'string') return [p.output];
      if (Array.isArray(p.output)) return p.output as string[];
      return [];
    });

    const failedPred = predictions.find((p) => p.status === 'failed' || p.status === 'canceled');

    return NextResponse.json({
      status: combinedStatus,
      output: allSucceeded ? outputs : null,
      error: failedPred?.error ?? null,
      progress: progressMap[combinedStatus] ?? 20,
      logs: predictions.map((p) => p.logs ?? '').join('\n'),
    });
  } catch (err: unknown) {
    console.error('[status] Error:', err);
    const message = err instanceof Error ? err.message : 'Status check failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
