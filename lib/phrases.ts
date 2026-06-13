import type { Language } from '@/types';

export interface Phrase {
  id: string;
  en: string;
  zh: string;
}

export const SAMPLE_PHRASES: Phrase[] = [
  { id: 'terima kasih', en: 'thank you', zh: '谢谢' },
  { id: 'kapan barang tiba', en: 'when will the goods arrive', zh: '货物什么时候到' },
  { id: 'berapa biaya pengiriman', en: 'how much is the shipping cost', zh: '运费多少钱' },
  { id: 'tolong kirim faktur', en: 'please send the invoice', zh: '请发送发票' },
  { id: 'kontainer sudah dikirim', en: 'the container has been shipped', zh: '集装箱已经发货' },
  { id: 'konfirmasi pesanan', en: 'order confirmation', zh: '订单确认' },
];

export function getSamples(uiLang: Language | 'auto', count = 4): Phrase[] {
  return SAMPLE_PHRASES.slice(0, count);
}
