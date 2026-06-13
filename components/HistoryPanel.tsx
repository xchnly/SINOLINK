'use client';

import type { Translations, UILang } from '@/lib/i18n';
import type { HistoryItem } from '@/types';

interface Props {
  history: HistoryItem[];
  uiLang: UILang;
  t: Translations;
  onReuse: (item: HistoryItem) => void;
  onClear: () => void;
}

const CODE: Record<string, string> = { auto: '·', zh: 'ZH', id: 'ID', en: 'EN' };

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function LangBadge({ code }: { code: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      padding: '2px 7px', borderRadius: 5, fontSize: 11, fontWeight: 700,
      background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)',
      letterSpacing: '.02em',
    }}>
      {CODE[code] ?? code.toUpperCase()}
    </span>
  );
}

export default function HistoryPanel({ history, t, onReuse, onClear }: Props) {
  if (history.length === 0) {
    return (
      <section style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.08em', margin: 0 }}>
            {t.historyTitle}
          </h2>
        </div>
        <p style={{ fontSize: 13.5, color: 'var(--text-3)', textAlign: 'center', padding: '18px 0', margin: 0 }}>
          {t.historyEmpty}
        </p>
      </section>
    );
  }

  return (
    <section style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.08em', margin: 0 }}>
          {t.historyTitle}
        </h2>
        <button
          onClick={onClear}
          style={{
            fontSize: 12.5, fontWeight: 500, color: 'var(--text-3)',
            background: 'none', border: 'none', cursor: 'pointer', padding: '3px 6px',
            transition: 'color .12s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--error)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-3)'; }}
        >
          {t.clearAll}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {history.map(item => (
          <button
            key={item.id}
            onClick={() => onReuse(item)}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 14, padding: '12px 16px', cursor: 'pointer',
              transition: 'border-color .15s, box-shadow .15s',
              boxShadow: 'var(--shadow-sm)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--primary-border)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 3px var(--primary-weak)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            {/* Row 1: badges + time */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <LangBadge code={item.from} />
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-3)', flexShrink: 0 }}>
                <path d="M5 12h14m-7-7 7 7-7 7"/>
              </svg>
              <LangBadge code={item.to} />
              <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
                {timeAgo(item.timestamp)}
              </span>
            </div>
            {/* Row 2: input → output */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-2)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.5 }}>
                {item.input}
              </p>
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.5 }}>
                {item.output}
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
