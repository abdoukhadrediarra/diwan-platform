/** Remove tashkeel and unify letter forms, so "الْقُرْآنَ" can be found by typing "القران". */
export function normalizeArabic(text: string): string {
  return text
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640\u200E\u200F]/g, '')
    .replace(/[ءئ]ا/g, 'ا')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/ء/g, '')
    .replace(/ى/g, 'ي').replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim();
}

const NON_JOINING = 'اأإآٱدذرزوؤةء';

/**
 * First letter of a sadr with its harakat, for highlighting acrostic letters.
 * A zero-width joiner keeps it joined to the rest of the word when that letter connects forward.
 */
export function splitInitial(sadr: string): { initial: string; joiner: string; rest: string } {
  const m = sadr.match(/^([\u0621-\u064A][\u064B-\u065F\u0670]*)([\s\S]*)$/);
  if (!m) return { initial: '', joiner: '', rest: sadr };
  const joins = !NON_JOINING.includes(m[1][0]) && /^[\u0621-\u064A]/.test(m[2]);
  return { initial: m[1], joiner: joins ? '\u200D' : '', rest: m[2] };
}
