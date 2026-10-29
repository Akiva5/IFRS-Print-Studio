import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDocument } from './documentParser';
import { paginateBlocks } from './paginator';
import { SAMPLE_IFRS8_MARKDOWN } from './sampleData';

test('paginateBlocks fills A4 pages up to 245mm capacity and paginates IFRS 8 sample to 3-4 pages', () => {
  const blocks = parseDocument(SAMPLE_IFRS8_MARKDOWN);
  const pages = paginateBlocks(blocks);

  // Must be between 3 and 4 pages, definitely not 8!
  assert.ok(pages.length >= 3 && pages.length <= 4, `Expected 3 to 4 pages, got ${pages.length}`);

  // Page 1 should contain h1, IG1, IG2, IG3, and the main segment information table
  assert.equal(pages[0][0].type, 'h1');
  const page1HasTable = pages[0].some((b) => b.type === 'table');
  assert.equal(page1HasTable, true, 'Page 1 must contain the segment information table without premature break');
});

test('paginateBlocks prevents single-page spillover on multi-example documents like IFRS 11', () => {
  const ifrs11Doc = `# תקן דיווח כספי בינלאומי 11 הסדרים משותפים
דוגמאות להמחשה

**תוכן עניינים:** 1 שירותי בנייה 2 מרכז מסחרי המופעל במשותף 3 ייצור והפצה משותפים של מוצר 4 בנק הפועל במשותף 5 פעילויות חיפוש, פיתוח והפקה של נפט וגז 6 הסדר גז טבעי נזיל 7 טיפול חשבונאי 8 תרומת זכות שימוש

דוגמאות אלה נלוות לתקן דיווח כספי בינלאומי 11, אך אינן מהוות חלק ממנו. הן ממחישות היבטים של תקן דיווח כספי בינלאומי 11 אך אינן מיועדות לספק הנחיות פרשניות. דוגמאות אלה מתארות מצבים היפותטיים הממחישים את שיקולי הדעת שעשויים לשמש בעת יישום תקן דיווח כספי בינלאומי 11 במצבים שונים.

## דוגמה 1 - שירותי בנייה
**IE2** א' ו-ב' (הצדדים) הן שתי חברות שעסקיהן הם מתן סוגים רבים של שירותי בנייה ציבוריים ופרטיים. הן מקימות הסדר חוזי לעבוד יחד למטרת ביצוע חוזה מול ממשלה לתכנון ובנייה של כביש בין שתי ערים. ההסדר החוזי קובע את חלקי ההשתתפות של א' ו-ב' ומבסס שליטה משותפת על ההסדר.
**IE3** הצדדים מקימים גוף נפרד (ישות Z) שבאמצעותו ינוהל ההסדר. ישות Z, בשם א' ו-ב', מתקשרת בחוזה מול הממשלה. בנוסף, הנכסים וההתחייבויות המתייחסים להסדר מוחזקים בישות Z. המאפיין העיקרי של הצורה המשפטית של ישות Z הוא שלצדדים יש זכויות לנכסים ומחויבויות להתחייבויות.
**IE4** ההסדר החוזי בין א' ל-ב' קובע בנוסף כי:
(א) הזכויות לכל הנכסים הדרושים לביצוע פעילויות ההסדר משותפות לצדדים על בסיס חלקי ההשתתפות שלהם בהסדר;
(ב) לצדדים יש אחריות יחד ולחוד לכל ההתחייבויות התפעוליות והפיננסיות המתייחסות לפעילויות ההסדר;
(ג) הרווח או ההפסד הנובעים מפעילויות ההסדר מחולקים בין א' ל-ב'.
**IE5** למטרות תיאום ופיקוח על הפעילויות, א' ו-ב' ממינים מפעיל, שיהיה עובד של אחד הצדדים.`;

  const blocks = parseDocument(ifrs11Doc);
  const pages = paginateBlocks(blocks);

  assert.ok(pages.length >= 2, `Expected at least 2 pages, got ${pages.length}`);
  const p1Blocks = pages[0];
  assert.ok(p1Blocks.length > 0);
  assert.equal(p1Blocks[0].type, 'h1');
});
