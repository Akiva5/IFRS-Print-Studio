import test from 'node:test';
import assert from 'node:assert/strict';
import { autoCleanMarkdown, convertItalicsToBold } from './markdownCleaner';

test('convertItalicsToBold converts single asterisks to double asterisks without breaking double asterisks', () => {
  const input = 'זהו *טקסט מודגש* וזהו **כבר מודגש** וזה שוב *מודגש פעם נוספת*.';
  const expected = 'זהו **טקסט מודגש** וזהו **כבר מודגש** וזה שוב **מודגש פעם נוספת**.';
  assert.equal(convertItalicsToBold(input), expected);
});

test('autoCleanMarkdown strips conversational AI intros', () => {
  const input = `שלום! להלן התרגום לעברית של IFRS 8:
# IFRS 8 מגזרי פעילות
**IG1** תוכן הסעיף הראשון.`;

  const cleaned = autoCleanMarkdown(input);
  assert.ok(!cleaned.includes('להלן התרגום'));
  assert.ok(cleaned.startsWith('# IFRS 8 מגזרי פעילות'));
});

test('autoCleanMarkdown strips translator notes', () => {
  const input = `**IG2** ישות א' פועלת בשלושה תחומים *(הערת מתרגם: במקור Operating Segments)* באופן שוטף.`;
  const cleaned = autoCleanMarkdown(input);
  assert.ok(!cleaned.includes('הערת מתרגם'));
  assert.equal(cleaned, `**IG2** ישות א' פועלת בשלושה תחומים  באופן שוטף.`);
});

test('autoCleanMarkdown converts italics and strips outro greetings', () => {
  const input = `**IE1** הדוגמה הזו היא *חשובה במיוחד*.

מקווה שזה עוזר ובהצלחה!`;
  const cleaned = autoCleanMarkdown(input);
  assert.equal(cleaned, `**IE1** הדוגמה הזו היא **חשובה במיוחד**.`);
});
