'use client';

import type { Translations } from '@/lib/i18n';
import type { Language, SourceLanguage } from '@/types';

interface Props {
  from: SourceLanguage;
  to: Language;
  fromMenuOpen: boolean;
  toMenuOpen: boolean;
  onToggleFrom: () => void;
  onToggleTo: () => void;
  onSelectFrom: (lang: SourceLanguage) => void;
  onSelectTo: (lang: Language) => void;
  onSwap: () => void;
  t: Translations;
}

const CODE: Record<string, string> = { auto: '·', zh: 'ZH', id: 'ID', en: 'EN' };

const FROM_OPTIONS: { value: SourceLanguage; name: keyof Translations; native: keyof Translations }[] = [
  { value: 'auto', name: 'autoDetect', native: 'autoDetect' },
  { value: 'zh',   name: 'langZh',    native: 'nativeZh' },
  { value: 'id',   name: 'langId',    native: 'nativeId' },
  { value: 'en',   name: 'langEn',    native: 'nativeEn' },
];
const TO_OPTIONS: { value: Language; name: keyof Translations; native: keyof Translations }[] = [
  { value: 'zh', name: 'langZh', native: 'nativeZh' },
  { value: 'id', name: 'langId', native: 'nativeId' },
  { value: 'en', name: 'langEn', native: 'nativeEn' },
];

function LangBtn({
  value, open, onToggle, t,
}: { value: string; open: boolean; onToggle: () => void; t: Translations }) {
  return (
    <button
      data-menu
      onClick={onToggle}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px',
        background: open ? 'var(--primary-weak)' : 'var(--surface-2)',
        border: `1px solid ${open ? 'var(--primary-border)' : 'var(--border)'}`,
        borderRadius: 12, cursor: 'pointer', transition: 'all .15s', minWidth: 120,
        color: open ? 'var(--primary)' : 'var(--text)',
      }}
    >
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 28, height: 22, borderRadius: 6, fontSize: 11, fontWeight: 700,
        background: open ? 'var(--primary)' : 'var(--border)',
        color: open ? '#fff' : 'var(--text-2)', flexShrink: 0,
        letterSpacing: '-.01em',
      }}>
        {CODE[value] ?? value.toUpperCase()}
      </span>
      <span style={{ fontSize: 14, fontWeight: 600, flex: 1, textAlign: 'left' }}>
        {value === 'auto' ? t.autoDetect : value === 'zh' ? t.langZh : value === 'id' ? t.langId : t.langEn}
      </span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
        <path d="M6 9l6 6 6-6"/>
      </svg>
    </button>
  );
}

function Dropdown<T extends string>({
  open, options, selected, onSelect, t,
}: {
  open: boolean;
  options: { value: T; name: keyof Translations; native: keyof Translations }[];
  selected: T;
  onSelect: (v: T) => void;
  t: Translations;
}) {
  if (!open) return null;
  return (
    <div
      data-menu
      style={{
        position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
        boxShadow: 'var(--shadow)', minWidth: 180, overflow: 'hidden',
        animation: 'sl-pop .12s ease',
      }}
    >
      {options.map(opt => {
        const active = opt.value === selected;
        return (
          <button
            key={opt.value}
            data-menu
            onClick={() => onSelect(opt.value)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '10px 14px', background: active ? 'var(--primary-weak)' : 'transparent',
              border: 'none', cursor: 'pointer', color: active ? 'var(--primary)' : 'var(--text)',
              textAlign: 'left', transition: 'background .1s',
            }}
            onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'; }}
            onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 22, borderRadius: 6, fontSize: 11, fontWeight: 700,
              background: active ? 'var(--primary)' : 'var(--surface-2)',
              color: active ? '#fff' : 'var(--text-2)', flexShrink: 0,
            }}>
              {CODE[opt.value] ?? opt.value.toUpperCase()}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>{t[opt.name] as string}</span>
              {opt.native !== opt.name && (
                <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{t[opt.native] as string}</span>
              )}
            </div>
            {active && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto', flexShrink: 0 }}>
                <path d="M20 6 9 17l-5-5"/>
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function LanguageSelector({ from, to, fromMenuOpen, toMenuOpen, onToggleFrom, onToggleTo, onSelectFrom, onSelectTo, onSwap, t }: Props) {
  const canSwap = from !== 'auto';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', flexWrap: 'wrap' }}>
      {/* From */}
      <div style={{ position: 'relative' }} data-menu>
        <LangBtn value={from} open={fromMenuOpen} onToggle={onToggleFrom} t={t} />
        <Dropdown open={fromMenuOpen} options={FROM_OPTIONS} selected={from} onSelect={onSelectFrom} t={t} />
      </div>

      {/* Swap */}
      <button
        onClick={onSwap}
        disabled={!canSwap}
        title={canSwap ? t.swapTitle : t.swapDisabled}
        style={{
          width: 34, height: 34, borderRadius: 10, border: '1px solid var(--border)',
          background: canSwap ? 'var(--primary)' : 'var(--surface-2)',
          color: canSwap ? '#fff' : 'var(--text-3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: canSwap ? 'pointer' : 'not-allowed',
          transition: 'all .15s', flexShrink: 0,
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4"/>
        </svg>
      </button>

      {/* To */}
      <div style={{ position: 'relative' }} data-menu>
        <LangBtn value={to} open={toMenuOpen} onToggle={onToggleTo} t={t} />
        <Dropdown open={toMenuOpen} options={TO_OPTIONS} selected={to} onSelect={onSelectTo} t={t} />
      </div>
    </div>
  );
}
