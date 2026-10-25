/**
 * Cleans and normalizes Hebrew IFRS translated text from conversational AI output:
 * - Strips conversational intro/outro lines ("להלן התרגום...", "בבקשה, להלן...", "מקווה שזה עוזר")
 * - Strips translator notes (e.g., *(הערת מתרגם:...)*, [הערת מתרגם:...])
 * - Converts single-asterisk italics (*טקסט*) into bold (**טקסט**), as official Israeli IFRS standards never use italics
 * - Normalizes excessive newlines and spaces
 */

export function autoCleanMarkdown(raw: string): string {
  if (!raw) return '';

  let text = raw;

  // 1. Remove common conversational AI greetings and intro lines at start of text
  const introPatterns = [
    /^\s*(שלום|היי|בוקר טוב|ערב טוב)[^\n]*\n+/i,
    /^\s*(להלן|הנה|מצורף|בבקשה,?\s*להלן)\s+(התרגום|תרגום|הדוגמה|דוגמה|ההנחיות|הטקסט|הנוסח|הגרסה)[^\n]*\n+/i,
    /^\s*כמבוקש,?\s*להלן[^\n]*\n+/i,
    /^\s*בוודאי,?\s*להלן[^\n]*\n+/i,
    /^\s*התרגום לעברית של[^\n]*\n+/i,
  ];

  for (const pattern of introPatterns) {
    text = text.replace(pattern, '');
  }

  // Also remove conversational outro lines at the very end
  const outroPatterns = [
    /\n+\s*(מקווה שזה עוזר|בהצלחה|אם יש שאלות נוספות|לשירותך תמיד|בברכה)[^\n]*$/i,
  ];
  for (const pattern of outroPatterns) {
    text = text.replace(pattern, '');
  }

  // 2. Remove translator notes
  // E.g.: *(הערת מתרגם: ...)* or (הערת מתרגם: ...) or [הערת מתרגם: ...] or *(הערת עורך: ...)*
  text = text.replace(
    /\*?\s*[\(\[]\s*הערת\s*(מתרגם|עורך|המערכת|המתרגמת)\s*:[^\)\]]*[\)\]]\s*\*?/gi,
    ''
  );
  // Also inline note like *(הערת מתרגם)*
  text = text.replace(
    /\*?\s*[\(\[]\s*הערת\s*(מתרגם|עורך|המערכת)\s*[\)\]]\s*\*?/gi,
    ''
  );

  // 3. Convert single-asterisk italics (*text*) into bold (**text**)
  // Israeli accounting standards exclusively use bold for emphasis, never italics.
  // We must carefully replace `*text*` without touching:
  // - `**text**` (already bold)
  // - bullet lists (line starting with `* `)
  // - horizontal rules `***`
  text = convertItalicsToBold(text);

  // 4. Normalize consecutive blank lines (max 2)
  text = text.replace(/\n{3,}/g, '\n\n');

  // 5. Clean trailing whitespace per line
  text = text
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n');

  return text.trim();
}

/**
 * Replaces *word* or *several words* with **word**, leaving existing **bold** intact.
 */
export function convertItalicsToBold(text: string): string {
  // Replace tokens using a tokenizer or regex that respects double asterisks.
  // Regex explanation:
  // (?<!\*)\*(?!\*)([^\*\n]+?)(?<!\*)\*(?!\*)
  // - (?<!\*) : not preceded by asterisk
  // - \* : single asterisk
  // - (?!\*) : not followed by asterisk
  // - ([^\*\n]+?) : inner content without asterisks or newlines
  // - (?<!\*) : not preceded by asterisk
  // - \* : single asterisk
  // - (?!\*) : not followed by asterisk
  const singleAsteriskRegex = /(?<!\*)\*(?!\*)([^\*\n]+?)(?<!\*)\*(?!\*)/g;
  return text.replace(singleAsteriskRegex, '**$1**');
}
