'use client';

import { useRef, useState } from 'react';
import type { Translations } from '@/lib/i18n';
import type { Language, SourceLanguage } from '@/types';

interface Props {
  from: SourceLanguage;
  to: Language;
  t: Translations;
}

const ACCEPTED = '.pdf,.docx,.txt';
const EXT_LABELS: Record<string, string> = { pdf: 'PDF', docx: 'DOCX', txt: 'TXT' };

const LANG_LABELS: Record<string, string> = {
  zh: 'Mandarin (中文)',
  id: 'Indonesia',
  en: 'English',
  auto: 'Auto',
};

function splitIntoChunks(text: string, max = 1500): string[] {
  if (text.length <= max) return [text];
  const chunks: string[] = [];
  let remaining = text.trim();
  while (remaining.length > max) {
    let cut = remaining.lastIndexOf('\n\n', max);
    if (cut <= 50) cut = remaining.lastIndexOf('\n', max);
    if (cut <= 50) cut = remaining.lastIndexOf('. ', max);
    if (cut <= 50) cut = remaining.lastIndexOf(' ', max);
    if (cut <= 0) cut = max;
    else cut = cut + 1;
    chunks.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks.filter(Boolean);
}

async function translateChunk(text: string, from: SourceLanguage, to: Language, signal: AbortSignal): Promise<string> {
  const res = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, from, to }),
    signal,
  });
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? 'Translation failed');
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let result = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }
  return result.trim();
}

function fileExt(name: string) { return name.split('.').pop()?.toLowerCase() ?? ''; }

function esc(str: string) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function openPDF(output: string, filename: string, from: SourceLanguage, to: Language) {
  const date = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  const paragraphs = output.split(/\n\n+/).filter(Boolean);

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>SinoLink — ${esc(filename)}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Plus Jakarta Sans','Noto Sans SC','PingFang SC','Microsoft YaHei',system-ui,sans-serif;color:#0f172a;background:#fff}
.wrap{max-width:760px;margin:0 auto;padding:52px 56px 64px}
.hdr{display:flex;align-items:center;gap:14px;padding-bottom:22px;border-bottom:2.5px solid #2563eb;margin-bottom:28px}
.icon{width:42px;height:42px;border-radius:11px;background:linear-gradient(150deg,#3b82f6,#1e40af);display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;font-weight:700;flex-shrink:0;font-family:'Noto Sans SC',sans-serif}
.brand{font-size:21px;font-weight:800;letter-spacing:-.02em}
.brand b{color:#2563eb;font-weight:800}
.brand-sub{font-size:12px;color:#64748b;margin-top:3px}
.date-right{margin-left:auto;font-size:13px;color:#64748b;text-align:right;line-height:1.5}
.meta{display:grid;grid-template-columns:max-content 1fr;gap:5px 20px;font-size:13px;margin-bottom:28px;padding:16px 18px;background:#f6f8fb;border-radius:10px;border:1px solid #e3e8ef}
.meta-k{font-weight:600;color:#94a3b8}
.meta-v{color:#334155}
hr{border:none;border-top:1px solid #e3e8ef;margin-bottom:32px}
.content{font-size:15px;line-height:1.85;color:#1e293b}
.content p{margin-bottom:1.25em}
.footer{margin-top:52px;padding-top:18px;border-top:1px solid #e3e8ef;text-align:center;font-size:12px;color:#94a3b8;line-height:1.8}
.footer strong{color:#2563eb}
.btn{position:fixed;top:18px;right:18px;padding:9px 20px;background:#2563eb;color:#fff;border:none;border-radius:9px;font-size:13.5px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 4px 12px rgba(37,99,235,.35)}
.btn:hover{background:#1d4ed8}
@media print{.btn{display:none}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{margin:2cm 2.5cm;size:A4}}
</style>
</head>
<body>
<button class="btn" onclick="window.print()">🖨 Print / Simpan PDF</button>
<div class="wrap">
  <div class="hdr">
    <div class="icon">译</div>
    <div>
      <div class="brand">Sino<b>Link</b></div>
      <div class="brand-sub">Dokumen Terjemahan</div>
    </div>
    <div class="date-right">${esc(date)}</div>
  </div>
  <div class="meta">
    <span class="meta-k">Berkas</span><span class="meta-v">${esc(filename)}</span>
    <span class="meta-k">Bahasa</span><span class="meta-v">${esc(LANG_LABELS[from] ?? from)} → ${esc(LANG_LABELS[to] ?? to)}</span>
  </div>
  <hr>
  <div class="content">
    ${paragraphs.map(p => `<p>${esc(p)}</p>`).join('\n    ')}
  </div>
  <div class="footer">
    Diterjemahkan oleh <strong>SinoLink</strong> · Mandarin · Indonesia · Inggris<br>
    © ${new Date().getFullYear()} SinoLink — dokumen ini dihasilkan secara otomatis
  </div>
</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

async function downloadDocx(output: string, filename: string, from: SourceLanguage, to: Language) {
  const {
    Document, Paragraph, TextRun, Header, Footer, Packer,
    AlignmentType, HeadingLevel, BorderStyle,
  } = await import('docx');

  const date = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  const paragraphs = output.split(/\n\n+/).filter(Boolean);

  const doc = new Document({
    sections: [{
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1800, right: 1800 } },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: 'Sino', bold: true, size: 22, color: '0f172a' }),
                new TextRun({ text: 'Link', bold: true, size: 22, color: '2563eb' }),
                new TextRun({ text: '  —  Dokumen Terjemahan', size: 20, color: '64748b' }),
              ],
              alignment: AlignmentType.RIGHT,
              border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '2563eb', space: 6 } },
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: 'Diterjemahkan oleh ', size: 18, color: '94a3b8' }),
                new TextRun({ text: 'SinoLink', bold: true, size: 18, color: '2563eb' }),
                new TextRun({ text: `  ·  ${LANG_LABELS[from] ?? from} → ${LANG_LABELS[to] ?? to}  ·  ${date}`, size: 18, color: '94a3b8' }),
              ],
              alignment: AlignmentType.CENTER,
              border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'e3e8ef', space: 6 } },
            }),
          ],
        }),
      },
      children: [
        new Paragraph({
          children: [new TextRun({ text: 'Hasil Terjemahan', bold: true, size: 32, color: '0f172a' })],
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Berkas: ', bold: true, size: 20, color: '64748b' }),
            new TextRun({ text: filename, size: 20, color: '334155' }),
          ],
          spacing: { after: 80 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Bahasa: ', bold: true, size: 20, color: '64748b' }),
            new TextRun({ text: `${LANG_LABELS[from] ?? from} → ${LANG_LABELS[to] ?? to}`, size: 20, color: '334155' }),
          ],
          spacing: { after: 80 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Tanggal: ', bold: true, size: 20, color: '64748b' }),
            new TextRun({ text: date, size: 20, color: '334155' }),
          ],
          spacing: { after: 360 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'e3e8ef', space: 8 } },
        }),
        ...paragraphs.map(p => new Paragraph({
          children: [new TextRun({ text: p, size: 24 })],
          spacing: { after: 200, line: 360 },
        })),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename.replace(/\.[^.]+$/, '')}_${to}.docx`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export default function DocumentTranslate({ from, to, t }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [output, setOutput] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = () => {
    setFile(null); setExtractedText(''); setOutput('');
    setError(null); setProgress({ current: 0, total: 0 });
    abortRef.current?.abort();
  };

  const handleFile = async (f: File) => {
    reset();
    setFile(f);
    const ext = fileExt(f.name);
    if (!['pdf', 'docx', 'txt'].includes(ext)) { setError(t.unsupportedFormat); return; }
    if (f.size > 5 * 1024 * 1024) { setError(t.fileTooLarge); return; }

    setIsExtracting(true);
    try {
      const form = new FormData();
      form.append('file', f);
      const res = await fetch('/api/extract', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to read document'); return; }
      setExtractedText(data.text);
    } catch { setError('Failed to read document'); }
    finally { setIsExtracting(false); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleTranslate = async () => {
    if (!extractedText) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const chunks = splitIntoChunks(extractedText);
    setProgress({ current: 0, total: chunks.length });
    setIsTranslating(true);
    setOutput(''); setError(null);
    try {
      let full = '';
      for (let i = 0; i < chunks.length; i++) {
        const translated = await translateChunk(chunks[i], from, to, ctrl.signal);
        full += (i > 0 ? '\n\n' : '') + translated;
        setOutput(full);
        setProgress({ current: i + 1, total: chunks.length });
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Translation failed');
    } finally { setIsTranslating(false); }
  };

  const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
  const fname = file?.name ?? 'document';

  return (
    <div style={{ padding: '20px 20px 16px' }}>
      {/* Drop zone */}
      {!file ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragOver ? 'var(--primary)' : 'var(--border)'}`,
            borderRadius: 16, padding: '40px 24px', textAlign: 'center',
            cursor: 'pointer', transition: 'all .15s',
            background: dragOver ? 'var(--primary-weak)' : 'var(--surface-2)',
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ color: dragOver ? 'var(--primary)' : 'var(--text-3)', display: 'block', margin: '0 auto 14px' }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: '0 0 6px' }}>{t.dropFile}</p>
          <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: 0 }}>{t.supportedFormats}</p>
          <input ref={inputRef} type="file" accept={ACCEPTED} style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--surface-2)', borderRadius: 14, border: '1px solid var(--border)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'var(--primary)', color: '#fff' }}>
            {EXT_LABELS[fileExt(fname)] ?? fileExt(fname).toUpperCase()}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fname}</p>
            {extractedText && <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-3)' }}>{extractedText.length.toLocaleString()} chars</p>}
          </div>
          <button onClick={reset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, borderRadius: 6, transition: 'color .12s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--error)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-3)'; }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      )}

      {error && <p style={{ marginTop: 12, fontSize: 13.5, color: 'var(--error)', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px' }}>{error}</p>}

      {isExtracting && (
        <p style={{ marginTop: 14, fontSize: 13.5, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin .7s linear infinite' }} />
          {t.extracting}
        </p>
      )}

      {extractedText && !isExtracting && !isTranslating && !output && (
        <button onClick={handleTranslate} style={{ marginTop: 14, width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', transition: 'opacity .12s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '.88'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}>
          {t.translateDoc}
        </button>
      )}

      {isTranslating && (
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12.5, color: 'var(--text-2)', fontWeight: 500 }}>{t.translatingDoc} {progress.current}/{progress.total}</span>
            <span style={{ fontSize: 12.5, color: 'var(--primary)', fontWeight: 700 }}>{pct}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 4, background: 'var(--primary)', width: `${pct}%`, transition: 'width .3s ease' }} />
          </div>
        </div>
      )}

      {output && (
        <div style={{ marginTop: 16 }}>
          {/* Preview */}
          <div style={{ maxHeight: 280, overflowY: 'auto', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.75, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{output}</p>
          </div>

          {/* Download buttons */}
          {!isTranslating && (
            <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => openPDF(output, fname, from, to)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, border: '1px solid var(--primary-border)', background: 'var(--primary-weak)', color: 'var(--primary)', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', transition: 'opacity .12s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '.8'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/><polyline points="9 9 10 9"/></svg>
                PDF
              </button>
              <button
                onClick={() => downloadDocx(output, fname, from, to)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', transition: 'opacity .12s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '.7'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Word (.docx)
              </button>
              <button
                onClick={handleTranslate}
                style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .12s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--primary-border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-2)'; }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>
                Ulangi
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
