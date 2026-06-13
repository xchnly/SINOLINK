'use client';

import { pinyin } from 'pinyin-pro';
import { useEffect, useState } from 'react';
import type { Translations, UILang } from '@/lib/i18n';
import type { Language, SourceLanguage } from '@/types';

interface Props {
  from: SourceLanguage;
  to: Language;
  input: string;
  output: string;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  copied: boolean;
  uiLang: UILang;
  onInputChange: (val: string) => void;
  onTranslate: () => void;
  onClear: () => void;
  onCopy: () => void;
  onListen: () => void;
  t: Translations;
}

const MAX_CHARS = 2000;

function PinyinText({ text }: { text: string }) {
  const items = pinyin(text, { type: 'all', toneType: 'symbol', nonZh: 'consecutive' });
  return (
    <span style={{ lineHeight: 2.8, display: 'inline' }}>
      {items.map((item, i) =>
        item.isZh ? (
          <ruby key={i} style={{ margin: '0 1px' }}>
            {item.origin}
            <rt style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 500, letterSpacing: '.01em' }}>
              {item.pinyin}
            </rt>
          </ruby>
        ) : (
          <span key={i}>{item.origin}</span>
        )
      )}
    </span>
  );
}



function Shimmer() {
  return (
    <div style={{ padding: '2px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[80, 60, 72].map((w, i) => (
        <div key={i} style={{
          height: 16, borderRadius: 6,
          background: 'linear-gradient(90deg, var(--border) 25%, var(--surface-2) 50%, var(--border) 75%)',
          backgroundSize: '200% 100%',
          animation: 'sl-shimmer 1.4s ease infinite',
          width: `${w}%`,
        }} />
      ))}
    </div>
  );
}

export default function TranslateBox({
  from, to, input, output, isLoading, isStreaming, error, copied,
  uiLang, onInputChange, onTranslate, onClear, onCopy, onListen, t,
}: Props) {
  const [showPinyin, setShowPinyin] = useState(false);

  useEffect(() => {
    if (to !== 'zh') setShowPinyin(false);
  }, [to]);

  const charRatio = input.length / MAX_CHARS;
  const isOverLimit = input.length >= MAX_CHARS;

  const panelBase: React.CSSProperties = {
    flex: 1, display: 'flex', flexDirection: 'column', minHeight: 230,
  };

  const footerBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', padding: '10px 16px',
    borderTop: '1px solid var(--border)', gap: 8, minHeight: 48,
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {/* ── Input panel ─────────────────────────────────────── */}
      <div style={{ ...panelBase, borderRight: '1px solid var(--border)' }}>
        {/* Textarea area */}
        <div style={{ flex: 1, position: 'relative' }}>
          <textarea
            value={input}
            onChange={e => onInputChange(e.target.value)}
            placeholder={t.inputPlaceholder}
            style={{
              width: '100%', height: '100%', minHeight: 180,
              padding: '18px 18px 8px', resize: 'none',
              background: 'transparent', border: 'none', outline: 'none',
              fontSize: 16, lineHeight: 1.65, color: 'var(--text)',
            }}
          />

        </div>

        {/* Input footer */}
        <div style={{ ...footerBase, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {input && (
              <button
                onClick={onClear}
                style={{
                  padding: '5px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 500,
                  background: 'transparent', border: '1px solid var(--border)',
                  color: 'var(--text-2)', cursor: 'pointer', transition: 'all .12s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--error)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--error)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-2)'; }}
              >
                {t.clear}
              </button>
            )}
            <button
              onClick={onTranslate}
              disabled={!input.trim() || isLoading || isStreaming}
              style={{
                padding: '5px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                background: (!input.trim() || isLoading || isStreaming) ? 'var(--surface-2)' : 'var(--primary)',
                color: (!input.trim() || isLoading || isStreaming) ? 'var(--text-3)' : '#fff',
                border: 'none', cursor: (!input.trim() || isLoading || isStreaming) ? 'not-allowed' : 'pointer',
                transition: 'all .12s',
              }}
            >
              {t.translateBtn}
            </button>
          </div>
          <span style={{
            fontSize: 12, fontWeight: 500, fontVariantNumeric: 'tabular-nums',
            color: isOverLimit ? 'var(--error)' : charRatio > 0.85 ? '#f59e0b' : 'var(--text-3)',
          }}>
            {input.length}/{MAX_CHARS}
          </span>
        </div>
      </div>

      {/* ── Output panel ────────────────────────────────────── */}
      <div style={panelBase}>
        <div style={{ flex: 1, padding: '18px 18px 8px', overflow: 'auto' }}>
          {isLoading ? (
            <Shimmer />
          ) : error ? (
            <p style={{ fontSize: 14, color: 'var(--error)', lineHeight: 1.6 }}>{error}</p>
          ) : output ? (
            <p style={{ fontSize: 16, lineHeight: showPinyin ? 2.8 : 1.65, color: 'var(--text)', whiteSpace: 'pre-wrap', margin: 0 }}>
              {showPinyin && to === 'zh' ? <PinyinText text={output} /> : output}
              {isStreaming && (
                <span style={{ display: 'inline-block', width: 2, height: 18, marginLeft: 3, background: 'var(--primary)', verticalAlign: 'middle', animation: 'sl-blink 1s step-end infinite', borderRadius: 1 }} />
              )}
            </p>
          ) : (
            <p style={{ fontSize: 14, color: 'var(--text-3)' }}>{t.outputPlaceholder}</p>
          )}
        </div>

        {/* Output footer */}
        <div style={{ ...footerBase, justifyContent: 'flex-end' }}>
          {/* Pinyin toggle — only when target is Chinese */}
          {to === 'zh' && output && !isStreaming && (
            <button
              onClick={() => setShowPinyin(p => !p)}
              title={t.pinyin}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                background: showPinyin ? 'var(--primary-weak)' : 'transparent',
                border: `1px solid ${showPinyin ? 'var(--primary)' : 'var(--border)'}`,
                color: showPinyin ? 'var(--primary)' : 'var(--text-2)',
                cursor: 'pointer', transition: 'all .12s',
              }}
            >
              <span style={{ fontFamily: "var(--font-noto-sc, 'Noto Sans SC'), sans-serif", fontSize: 13 }}>拼</span>
              {t.pinyin}
            </button>
          )}
          {output && !isStreaming && (
            <>
              {/* Listen */}
              <button
                onClick={onListen}
                title={t.listen}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '5px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 500,
                  background: 'transparent', border: '1px solid var(--border)',
                  color: 'var(--text-2)', cursor: 'pointer', transition: 'all .12s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--primary-border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-2)'; }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/>
                </svg>
                {t.listen}
              </button>

              {/* Copy */}
              <button
                onClick={onCopy}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '5px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 500,
                  background: copied ? 'var(--success-weak)' : 'transparent',
                  border: `1px solid ${copied ? 'var(--success)' : 'var(--border)'}`,
                  color: copied ? 'var(--success)' : 'var(--text-2)',
                  cursor: 'pointer', transition: 'all .12s',
                }}
                onMouseEnter={e => { if (!copied) { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--primary-border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary)'; } }}
                onMouseLeave={e => { if (!copied) { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-2)'; } }}
              >
                {copied ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5"/>
                    </svg>
                    {t.copied}
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                    </svg>
                    {t.copy}
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
