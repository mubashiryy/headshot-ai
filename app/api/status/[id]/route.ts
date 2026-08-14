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

    const prediction = await replicate.predictions.get(id);

    // Map Replicate status to a numeric progress for the UI
    const progressMap: Record<string, number> = {
      starting: 12,
      processing: 55,
      succeeded: 100,
      failed: 0,
      canceled: 0,
    };

    return NextResponse.json({
      status: prediction.status,
      output: prediction.output as string[] | null,
      error: prediction.error,
      progress: progressMap[prediction.status] ?? 20,
      logs: prediction.logs ?? '',
    });
  } catch (err: unknown) {
    console.error('[status] Error:', err);
    const message = err instanceof Error ? err.message : 'Status check failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
