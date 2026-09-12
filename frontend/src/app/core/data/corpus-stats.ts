import { Bayt, CorpusStats } from '../models/corpus.model';

/**
 * Figures computed from the complete text of the 7 diwans (diwan_corpus_complet.docx).
 * Abyat = lines with hemistichs separated by "|"; words and letters are counted on the Arabic text.
 * When the Django API is online these come from GET /api/v1/corpus/ instead (see CorpusService).
 */
export const CORPUS_STATS: CorpusStats = {
  pages: 1455,
  diwans: [
    { number: 1, title: 'ديوان القرآنية', abyat: 5588, hemistichs: 11203, words: 65700, letters: 266978 },
    { number: 2, title: 'ديوان الأمداح النبوية', abyat: 6059, hemistichs: 13156, words: 71121, letters: 287387 },
    { number: 3, title: 'مراقي الأمن والسعادة', abyat: 3840, hemistichs: 7680, words: 44631, letters: 185764 },
    { number: 4, title: 'الفيوضات الربانية بالأعوام والشهور', abyat: 5523, hemistichs: 11046, words: 67682, letters: 278807 },
    { number: 5, title: 'القصائد المطرزة بغير الآيات القرآنية', abyat: 5387, hemistichs: 10774, words: 69448, letters: 287667 },
    { number: 6, title: 'الفيوضات الربانية في الذكر والشكر والتحدث بالنعم الإلهية', abyat: 4857, hemistichs: 9714, words: 57324, letters: 236171 },
    { number: 7, title: 'الفلك المشحون', abyat: 8994, hemistichs: 17988, words: 85164, letters: 341688 },
  ],
};

/** First bayt of D01K08, with its tashkeel and its local transcription, as produced by the backend. */
export const FEATURED_BAYT: Bayt & { poemName: string; diwan: number } = {
  poemName: 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ وَقَدْ أَعَاذَنِي مِنْهُ',
  diwan: 1,
  hemistichs: ['إِلَيَّ وَحْدِي سَلَبَ الْقُرْآنَا', 'مَنْ كَوْنُهُ لِي بِالْمُنَى قَدْ آنَا'],
  transcription: ["ilayya wahdî salabal qour'ânâ", 'man kawnouhou lî bil mounâ qad ânâ'],
};
