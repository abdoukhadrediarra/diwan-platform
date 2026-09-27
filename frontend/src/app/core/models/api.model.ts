/** Shapes returned by the Django API (/api/v1/...). */

export interface DiwanSummary {
  number: number;
  slug: string;
  title: string;
  poem_count: number;        // published khassaïdes
  published_abyat: number;
  corpus_abyat: number;      // figures of the diwan's complete text
  corpus_hemistichs: number;
  corpus_words: number;
}

export interface PoemSummary {
  code: string;
  number: number;
  slug: string;
  title: string;
  title_source: 'name_line' | 'first_sadr';
  is_acrostic: boolean;
  bayt_count: number;
  hemistichs_per_bayt: number;
}

export interface DiwanDetail extends DiwanSummary {
  poems: PoemSummary[];
}

export type Section = 'muqaddima' | 'title' | 'matn' | 'khatima';

export interface PoemLine {
  position: number;
  section: Section;
  kind: 'prose' | 'title' | 'bayt' | 'header' | 'quran';
  bayt_number: number | null;
  hemistichs: string[];
  transcription: Record<string, string[]>;   // { local: [...] }
}

export interface PoemLink {
  slug: string;
  title: string;
  number: number;
}

export interface PoemDetail extends PoemSummary {
  acrostic_match: number | null;
  incipit: string;
  diwan: { number: number; slug: string; title: string };
  lines: PoemLine[];
  previous: PoemLink | null;
  next: PoemLink | null;
}

export interface CorpusOverview {
  diwan_count: number;
  poem_count: number;
  published_abyat: number;
  corpus_abyat: number;
  corpus_hemistichs: number;
  corpus_words: number;
  diwans: DiwanSummary[];
}
