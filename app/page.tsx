'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import DocumentTranslate from '@/components/DocumentTranslate';
import HistoryPanel from '@/components/HistoryPanel';
import LanguageSelector from '@/components/LanguageSelector';
import ThemeToggle from '@/components/ThemeToggle';
import TranslateBox from '@/components/TranslateBox';
import { translations, UI_LANG_OPTIONS } from '@/lib/i18n';
import type { UILang } from '@/lib/i18n';
import type { HistoryItem, Language, SourceLanguage } from '@/types';

const MAX_CHARS = 2000;
const DEBOUNCE_MS = 600;
const MAX_HISTORY = 10;

function loadLS<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}
function saveLS(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* */ }
}

export default function Home() {
  // ── Global preferences ──────────────────────────────────────
  const [theme, setThemeState] = useState<'light' | 'dark'>(() =>
    typeof window !== 'undefined' && localStorage.getItem('sinolink_theme') === 'dark' ? 'dark' : 'light'
  );
  const [uiLang, setUILangState] = useState<UILang>(() =>
    typeof window !== 'undefined' ? (loadLS('sinolink_uilang', 'id') as UILang) : 'id'
  );
  const t = translations[uiLang];

  // ── Tab ──────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'text' | 'doc'>('text');

  // ── Language pair ────────────────────────────────────────────
  const [from, setFrom] = useState<SourceLanguage>('auto');
  const [to, setTo] = useState<Language>('id');
  const [fromMenuOpen, setFromMenuOpen] = useState(false);
  const [toMenuOpen, setToMenuOpen] = useState(false);

  // ── Translation ──────────────────────────────────────────────
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ── History ──────────────────────────────────────────────────
  const [history, setHistory] = useState<HistoryItem[]>(() =>
    typeof window !== 'undefined' ? loadLS('sinolink_history', []) : []
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastRef = useRef('');

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    saveLS('sinolink_theme', theme);
  }, [theme]);

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest?.('[data-menu]')) {
        setFromMenuOpen(false);
        setToMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Cleanup on unmount
  useEffect(() => () => {
    abortRef.current?.abort();
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  // ── Actions ──────────────────────────────────────────────────
  const toggleTheme = () => setThemeState(t => t === 'light' ? 'dark' : 'light');

  const setUILang = (lang: UILang) => {
    setUILangState(lang);
    saveLS('sinolink_uilang', lang);
  };

  const translate = useCallback(async (text: string, fromLang: SourceLanguage, toLang: Language) => {
    if (!text.trim() || text === lastRef.current) return;
    lastRef.current = text;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setIsLoading(true);
    setIsStreaming(false);
    setError(null);
    setOutput('');

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, from: fromLang, to: toLang }),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Error. Coba lagi.');
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setIsStreaming(true);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setOutput(full);
      }

      setIsStreaming(false);

      if (full.trim()) {
        const entry: HistoryItem = {
          id: Date.now().toString(),
          from: fromLang,
          to: toLang,
          input: text,
          output: full.trim(),
          timestamp: Date.now(),
        };
        setHistory(prev => {
          const next = [entry, ...prev.filter(h =>
            !(h.input === text && h.from === fromLang && h.to === toLang)
          )].slice(0, MAX_HISTORY);
          saveLS('sinolink_history', next);
          return next;
        });
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError('Koneksi gagal. Periksa internet Anda.');
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, []);

  const scheduleTranslate = (text: string, fromLang = from, toLang = to) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => translate(text, fromLang, toLang), DEBOUNCE_MS);
  };

  const handleInputChange = (val: string) => {
    if (val.length > MAX_CHARS) return;
    setInput(val);
    setCopied(false);
    if (!val.trim()) {
      setOutput(''); setError(null); lastRef.current = '';
      abortRef.current?.abort();
      return;
    }
    scheduleTranslate(val);
  };

  const handleTranslate = () => {
    lastRef.current = '';
    if (debounceRef.current) clearTimeout(debounceRef.current);
    translate(input, from, to);
  };

  const handleClear = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();
    setInput(''); setOutput(''); setError(null); lastRef.current = '';
    setCopied(false);
  };

  const handleCopy = () => {
    if (!output) return;
    try { navigator.clipboard.writeText(output); } catch { /* */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1700);
  };

  const handleListen = () => {
    if (!output) return;
    try {
      const u = new SpeechSynthesisUtterance(output);
      u.lang = { zh: 'zh-CN', id: 'id-ID', en: 'en-US' }[to] ?? 'en-US';
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    } catch { /* */ }
  };

  const handleSelectFrom = (lang: SourceLanguage) => {
    let newTo = to;
    if (lang !== 'auto' && lang === to) newTo = lang === 'id' ? 'en' : 'id';
    setFrom(lang); setTo(newTo); setFromMenuOpen(false);
    if (input.trim()) { lastRef.current = ''; scheduleTranslate(input, lang, newTo); }
  };

  const handleSelectTo = (lang: Language) => {
    let newFrom = from;
    if (from !== 'auto' && from === lang) newFrom = lang === 'id' ? 'en' : 'id';
    setTo(lang); setFrom(newFrom); setToMenuOpen(false);
    if (input.trim()) { lastRef.current = ''; scheduleTranslate(input, newFrom, lang); }
  };

  const handleSwap = () => {
    const resolved: Language = from === 'auto' ? 'zh' : (from as Language);
    const newFrom = to;
    const newTo = resolved;
    const newInput = output;
    setFrom(newFrom); setTo(newTo);
    setInput(newInput); setOutput(input);
    lastRef.current = '';
    if (newInput.trim()) scheduleTranslate(newInput, newFrom, newTo);
  };

  const handleReuseHistory = (item: HistoryItem) => {
    setFrom(item.from); setTo(item.to);
    setInput(item.input); lastRef.current = '';
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => translate(item.input, item.from, item.to), 30);
  };

  const handleClearHistory = () => {
    setHistory([]); saveLS('sinolink_history', []);
  };

  // ── Render ───────────────────────────────────────────────────
  const S = {
    root: {
      minHeight: '100vh',
      background: 'var(--bg)',
      color: 'var(--text)',
      fontFamily: "var(--font-jakarta, 'Plus Jakarta Sans'), system-ui, -apple-system, sans-serif",
      WebkitFontSmoothing: 'antialiased',
      transition: 'background .25s, color .25s',
    } as React.CSSProperties,
    inner: { maxWidth: 1080, margin: '0 auto', padding: '26px 20px 48px' } as React.CSSProperties,
  };

  return (
    <div data-theme={theme} style={S.root}>
      <div style={S.inner}>

        {/* ── Header ─────────────────────────────────────── */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <div style={{ width: 42, height: 42, borderRadius: 13, background: 'linear-gradient(150deg, var(--primary), #1e40af)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px -4px rgba(37,99,235,.5)', flexShrink: 0 }}>
              <span style={{ fontFamily: "var(--font-noto-sc, 'Noto Sans SC'), sans-serif", fontWeight: 700, fontSize: 22, color: '#fff', lineHeight: 1 }}>译</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1 }}>
                Sino<span style={{ color: 'var(--primary)' }}>Link</span>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-2)', fontWeight: 500 }}>{t.tagline}</div>
            </div>
          </div>

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* UI lang switcher */}
            <div title={t.uiLangLabel} style={{ display: 'inline-flex', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 11, padding: 3 }}>
              {UI_LANG_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setUILang(opt.value)}
                  style={{
                    padding: '6px 13px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: 13, fontWeight: 700, transition: 'all .15s',
                    background: uiLang === opt.value ? 'var(--surface)' : 'transparent',
                    color: uiLang === opt.value ? 'var(--primary)' : 'var(--text-2)',
                    boxShadow: uiLang === opt.value ? '0 1px 2px rgba(15,23,42,.14)' : 'none',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <ThemeToggle isDark={theme === 'dark'} onToggle={toggleTheme} label={theme === 'dark' ? t.lightMode : t.darkMode} />
          </div>
        </header>

        {/* ── Main card ──────────────────────────────────── */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 22, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
          {/* Tab bar + language selector row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', padding: '0 18px', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['text', 'doc'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '13px 16px', fontSize: 13.5, fontWeight: 600, border: 'none',
                    background: 'transparent', cursor: 'pointer', transition: 'color .15s',
                    color: activeTab === tab ? 'var(--primary)' : 'var(--text-2)',
                    borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                    marginBottom: -1,
                  }}
                >
                  {tab === 'text' ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
                      {t.textTab}
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      {t.docTab}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <LanguageSelector
              from={from} to={to}
              fromMenuOpen={fromMenuOpen} toMenuOpen={toMenuOpen}
              onToggleFrom={() => { setFromMenuOpen(o => !o); setToMenuOpen(false); }}
              onToggleTo={() => { setToMenuOpen(o => !o); setFromMenuOpen(false); }}
              onSelectFrom={handleSelectFrom} onSelectTo={handleSelectTo}
              onSwap={handleSwap} t={t}
            />
          </div>

          {activeTab === 'text' ? (
            <TranslateBox
              from={from} to={to}
              input={input} output={output}
              isLoading={isLoading} isStreaming={isStreaming}
              error={error} copied={copied}
              uiLang={uiLang}
              onInputChange={handleInputChange}
              onTranslate={handleTranslate}
              onClear={handleClear}
              onCopy={handleCopy}
              onListen={handleListen}
              t={t}
            />
          ) : (
            <DocumentTranslate from={from} to={to} t={t} />
          )}
        </div>

        {/* ── History ────────────────────────────────────── */}
        <HistoryPanel
          history={history}
          uiLang={uiLang}
          t={t}
          onReuse={handleReuseHistory}
          onClear={handleClearHistory}
        />

        {/* ── Footer ─────────────────────────────────────── */}
        <footer style={{ marginTop: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap', color: 'var(--text-3)', fontSize: 12.5 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--success)', fontWeight: 600 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>
            </svg>
            {t.secure}
          </span>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-3)' }} />
          <span>SinoLink · v1.0 · © {new Date().getFullYear()}</span>
        </footer>

      </div>
    </div>
  );
}
