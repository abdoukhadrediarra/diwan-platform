/** One diwan and its figures. */
export interface DiwanStats {
  number: number;
  /** Arabic title. */
  title: string;
  abyat: number;
  hemistichs: number;
  words: number;
  letters: number;
}

export interface CorpusStats {
  diwans: DiwanStats[];
  /** Page count of the complete typed corpus. */
  pages: number;
}

/** A bayt as the API will return it: hemistichs plus their transcription. */
export interface Bayt {
  hemistichs: string[];
  transcription?: string[];
}
