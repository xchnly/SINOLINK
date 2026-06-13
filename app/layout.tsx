import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Noto_Sans_SC } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const notoSC = Noto_Sans_SC({
  variable: '--font-noto-sc',
  weight: ['400', '500', '700'],
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  title: 'SinoLink — Terjemahan Mandarin · Indonesia · Inggris',
  description:
    'Terjemahan cepat dan akurat antara Bahasa Mandarin, Indonesia, dan Inggris.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="id"
      className={`${jakarta.variable} ${notoSC.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('sinolink_theme');document.documentElement.setAttribute('data-theme',t==='dark'?'dark':'light')}catch(e){}`,
          }}
        />
      </head>
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
