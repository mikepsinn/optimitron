import { NextResponse, type NextRequest } from 'next/server';
import { retrieveManualContext } from '@/lib/manual-search.server';

interface RAGRequestBody {
  query: string;
}

/**
 * POST /api/voice/rag
 *
 * Retrieves context from the manual's published search index.
 * Called by the client when the Live API model invokes the retrieveContext tool.
 */
export async function POST(request: NextRequest) {
  let body: RAGRequestBody;
  try {
    body = (await request.json()) as RAGRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.query || typeof body.query !== 'string') {
    return NextResponse.json({ error: 'Missing required field: query' }, { status: 400 });
  }

  try {
    const response = await retrieveManualContext(body.query);
    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'RAG retrieval failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
