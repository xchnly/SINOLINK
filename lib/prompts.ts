const LANG_NAMES: Record<string, string> = {
  zh: 'Chinese (Simplified Mandarin)',
  id: 'Indonesian',
  en: 'English',
};

export function buildTranslationPrompt(text: string, from: string, to: string): string {
  const fromDesc =
    from === 'auto'
      ? 'the source language (detect it automatically)'
      : LANG_NAMES[from] ?? from;

  return `You are a professional translator specializing in Chinese (Mandarin), Indonesian, and English.

Translate the following text from ${fromDesc} to ${LANG_NAMES[to] ?? to}.

Rules:
- Return ONLY the translated text, no explanation, no preamble, no quotes
- Preserve original formatting, line breaks, numbers, and punctuation
- Use formal/professional register
- For Chinese output: use Simplified Chinese characters

Text to translate:
${text}`;
}
