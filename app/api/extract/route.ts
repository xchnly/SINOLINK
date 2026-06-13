import { NextRequest, NextResponse } from 'next/server';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 413 });

  const ext = file.name.split('.').pop()?.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    let text = '';

    if (ext === 'txt') {
      text = buffer.toString('utf-8');
    } else if (ext === 'pdf') {
      const { extractText } = await import('unpdf');
      const { text: pages } = await extractText(new Uint8Array(buffer));
      text = Array.isArray(pages) ? pages.join('\n\n') : (pages as string);
    } else if (ext === 'docx') {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      return NextResponse.json({ error: 'Unsupported format. Use PDF, DOCX, or TXT.' }, { status: 400 });
    }

    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
    if (!text) return NextResponse.json({ error: 'No text found in document' }, { status: 422 });

    return NextResponse.json({ text, chars: text.length });
  } catch {
    return NextResponse.json({ error: 'Failed to read document' }, { status: 500 });
  }
}
