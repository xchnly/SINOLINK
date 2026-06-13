export type UILang = 'id' | 'en' | 'zh';

export interface Translations {
  tagline: string;
  uiLangLabel: string;
  theme: string;
  autoDetect: string;
  langZh: string;
  langId: string;
  langEn: string;
  nativeZh: string;
  nativeId: string;
  nativeEn: string;
  swapTitle: string;
  swapDisabled: string;
  inputPlaceholder: string;
  samples: string;
  clear: string;
  translateBtn: string;
  outputPlaceholder: string;
  copy: string;
  copied: string;
  listen: string;
  detected: string;
  historyTitle: string;
  historyEmpty: string;
  clearAll: string;
  darkMode: string;
  lightMode: string;
  secure: string;
  pinyin: string;
  textTab: string;
  docTab: string;
  dropFile: string;
  supportedFormats: string;
  extracting: string;
  translatingDoc: string;
  translateDoc: string;
  downloadTxt: string;
  fileTooLarge: string;
  unsupportedFormat: string;
  docDone: string;
}

export const translations: Record<UILang, Translations> = {
  id: {
    tagline: 'Mandarin · Indonesia · Inggris',
    uiLangLabel: 'Bahasa tampilan',
    theme: 'Ganti tema',
    autoDetect: 'Deteksi Otomatis',
    langZh: 'Mandarin',
    langId: 'Indonesia',
    langEn: 'Inggris',
    nativeZh: '中文',
    nativeId: 'Bahasa Indonesia',
    nativeEn: 'English',
    swapTitle: 'Tukar bahasa',
    swapDisabled: 'Tidak bisa tukar saat deteksi otomatis',
    inputPlaceholder: 'Ketik atau tempel teks di sini…',
    samples: 'Coba:',
    clear: 'Bersihkan',
    translateBtn: 'Terjemahkan',
    outputPlaceholder: 'Terjemahan akan muncul di sini',
    copy: 'Salin',
    copied: 'Tersalin',
    listen: 'Dengarkan',
    detected: 'Terdeteksi',
    historyTitle: 'Riwayat Terjemahan',
    historyEmpty: 'Belum ada terjemahan. Hasil Anda akan tersimpan di sini.',
    clearAll: 'Hapus semua',
    darkMode: 'Aktifkan mode gelap',
    lightMode: 'Aktifkan mode terang',
    secure: 'Koneksi aman',
    pinyin: 'Pinyin',
    textTab: 'Teks',
    docTab: 'Dokumen',
    dropFile: 'Seret file ke sini atau klik untuk pilih',
    supportedFormats: 'PDF · DOCX · TXT  —  maks. 5 MB',
    extracting: 'Membaca dokumen…',
    translatingDoc: 'Menerjemahkan…',
    translateDoc: 'Terjemahkan Dokumen',
    downloadTxt: 'Unduh .txt',
    fileTooLarge: 'File terlalu besar (maks. 5 MB)',
    unsupportedFormat: 'Format tidak didukung. Gunakan PDF, DOCX, atau TXT.',
    docDone: 'Selesai',
  },
  en: {
    tagline: 'Chinese · Indonesian · English',
    uiLangLabel: 'Display language',
    theme: 'Toggle theme',
    autoDetect: 'Auto Detect',
    langZh: 'Chinese',
    langId: 'Indonesian',
    langEn: 'English',
    nativeZh: '中文',
    nativeId: 'Bahasa Indonesia',
    nativeEn: 'English',
    swapTitle: 'Swap languages',
    swapDisabled: 'Cannot swap with auto-detect',
    inputPlaceholder: 'Type or paste text here…',
    samples: 'Try:',
    clear: 'Clear',
    translateBtn: 'Translate',
    outputPlaceholder: 'Translation will appear here',
    copy: 'Copy',
    copied: 'Copied',
    listen: 'Listen',
    detected: 'Detected',
    historyTitle: 'Translation History',
    historyEmpty: 'No translations yet. Your results will be saved here.',
    clearAll: 'Clear all',
    darkMode: 'Enable dark mode',
    lightMode: 'Enable light mode',
    secure: 'Secure connection',
    pinyin: 'Pinyin',
    textTab: 'Text',
    docTab: 'Document',
    dropFile: 'Drop file here or click to select',
    supportedFormats: 'PDF · DOCX · TXT  —  max. 5 MB',
    extracting: 'Reading document…',
    translatingDoc: 'Translating…',
    translateDoc: 'Translate Document',
    downloadTxt: 'Download .txt',
    fileTooLarge: 'File too large (max. 5 MB)',
    unsupportedFormat: 'Unsupported format. Use PDF, DOCX, or TXT.',
    docDone: 'Done',
  },
  zh: {
    tagline: '中文 · 印尼语 · 英语',
    uiLangLabel: '界面语言',
    theme: '切换主题',
    autoDetect: '自动检测',
    langZh: '中文',
    langId: '印尼语',
    langEn: '英语',
    nativeZh: '中文',
    nativeId: 'Bahasa Indonesia',
    nativeEn: 'English',
    swapTitle: '交换语言',
    swapDisabled: '自动检测时无法交换',
    inputPlaceholder: '在此输入或粘贴文字…',
    samples: '试试:',
    clear: '清除',
    translateBtn: '翻译',
    outputPlaceholder: '翻译结果将显示在此处',
    copy: '复制',
    copied: '已复制',
    listen: '朗读',
    detected: '检测到',
    historyTitle: '翻译历史',
    historyEmpty: '暂无翻译记录，您的结果将保存在此处。',
    clearAll: '清除全部',
    darkMode: '启用深色模式',
    lightMode: '启用浅色模式',
    secure: '安全连接',
    pinyin: '拼音',
    textTab: '文字',
    docTab: '文件',
    dropFile: '拖放文件到此处或点击选择',
    supportedFormats: 'PDF · DOCX · TXT  —  最大 5 MB',
    extracting: '读取文件中…',
    translatingDoc: '翻译中…',
    translateDoc: '翻译文件',
    downloadTxt: '下载 .txt',
    fileTooLarge: '文件过大（最大 5 MB）',
    unsupportedFormat: '不支持的格式，请使用 PDF、DOCX 或 TXT。',
    docDone: '完成',
  },
};

export const UI_LANG_OPTIONS: { value: UILang; label: string }[] = [
  { value: 'id', label: 'ID' },
  { value: 'en', label: 'EN' },
  { value: 'zh', label: '中' },
];
