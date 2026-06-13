import { headers } from 'next/headers';
import { buildTranslationPrompt } from '@/lib/prompts';

const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX ?? '20');
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000');

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

export async function POST(req: Request) {
  const headersList = await headers();
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';

  if (!checkRateLimit(ip)) {
    return Response.json(
      { error: 'Terlalu banyak permintaan. Coba lagi dalam 1 menit.' },
      { status: 429 }
    );
  }

  let body: { text?: unknown; from?: unknown; to?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Request tidak valid.' }, { status: 400 });
  }

  const { text, from, to } = body;

  if (!text || typeof text !== 'string' || text.trim() === '') {
    return Response.json({ error: 'Teks tidak boleh kosong.' }, { status: 400 });
  }
  if (text.length > 2000) {
    return Response.json(
      { error: 'Teks melebihi batas 2000 karakter.' },
      { status: 400 }
    );
  }
  if (!from || !to || typeof from !== 'string' || typeof to !== 'string') {
    return Response.json({ error: 'Bahasa tidak valid.' }, { status: 400 });
  }
  if (!process.env.GEMINI_API_KEY) {
    return Response.json(
      { error: 'Layanan terjemahan belum dikonfigurasi.' },
      { status: 500 }
    );
  }

  const prompt = buildTranslationPrompt(text, from, to);

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
      }),
    }
  );

  if (!geminiRes.ok || !geminiRes.body) {
    return Response.json(
      { error: 'Layanan terjemahan tidak tersedia saat ini.' },
      { status: 502 }
    );
  }

  const upstream = geminiRes.body;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === '[DONE]') continue;
            try {
              const data = JSON.parse(jsonStr);
              const chunk: string =
                data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
              if (chunk) controller.enqueue(encoder.encode(chunk));
            } catch {
              // incomplete JSON chunk — skip
            }
          }
        }
      } finally {
        controller.close();
        reader.releaseLock();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
