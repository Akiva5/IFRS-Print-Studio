import React, { useState } from 'react';
import {
  Sparkles,
  Trash2,
  FileSpreadsheet,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  Wand2,
  HelpCircle
} from 'lucide-react';
import { SAMPLE_IFRS8_MARKDOWN } from '../utils/sampleData';

interface MarkdownEditorProps {
  value: string;
  onChange: (val: string) => void;
  onAutoClean: () => void;
  onLoadSample: (sample: string) => void;
  onClear: () => void;
  hasAutoCleanNotice?: boolean;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  onAutoClean,
  onLoadSample,
  onClear,
  hasAutoCleanNotice,
}) => {
  const [copied, setCopied] = useState(false);
  const [showTips, setShowTips] = useState(false);

  // Compute live stats
  const lineCount = value ? value.split('\n').length : 0;
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;
  const tableCount = (value.match(/^\|(?:\s*:?-+:?\s*\|)+\s*$/gm) || []).length;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const insertSnippet = (snippet: string) => {
    onChange(value ? `${value}\n\n${snippet}` : snippet);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800">
      {/* Editor Sub-Toolbar */}
      <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left Actions (in RTL, visually right) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-300 font-semibold px-1">
            טקסט מקור (Markdown)
          </span>

          <button
            onClick={() => onLoadSample(SAMPLE_IFRS8_MARKDOWN)}
            title="טען דוגמה מקיפה מתקן IFRS 8 מגזרי פעילות כולל טבלאות ותרשימי זרימה"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>טען דוגמה (IFRS 8 IG)</span>
          </button>

          <button
            onClick={onAutoClean}
            title="הסרת שורות פתיחה של AI, מחיקת הערות מתרגם, והמרת כל ההטיות להדגשה תקנית"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition font-medium"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Auto-Clean Markdown</span>
          </button>

          <button
            onClick={onClear}
            title="נקה את כל הטקסט בעורך"
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800/80 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-800/50 text-slate-400 border border-slate-700 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>נקה</span>
          </button>
        </div>

        {/* Right Tools (in RTL, visually left) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTips(!showTips)}
            title="כללי תחביר IFRS"
            className={`p-1 rounded border transition ${
              showTips
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopy}
            title="העתק טקסט"
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">הועתק</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>העתק</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Syntax Helper Drawer (Collapsible) */}
      {showTips && (
        <div className="bg-slate-950/90 border-b border-slate-800 p-3 text-xs text-slate-300 grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in duration-150">
          <div>
            <span className="font-semibold text-amber-400 block mb-1">
              כללי סדר ועימוד של המוסד לתקינה:
            </span>
            <ul className="space-y-1 text-slate-400 text-[11px] list-disc list-inside">
              <li>
                סעיף תלוי: פתח שורה ב-{' '}
                <code className="text-amber-300 font-mono">**IG1**</code> או{' '}
                <code className="text-amber-300 font-mono">**IE1**</code>.
              </li>
              <li>
                כותרת ראשית ממסגרת:{' '}
                <code className="text-amber-300 font-mono"># שם התקן</code>.
              </li>
              <li>
                הערות שוליים לטבלה: פתח שורה ב-{' '}
                <code className="text-amber-300 font-mono">(א)</code> או{' '}
                <code className="text-amber-300 font-mono">(ב)</code> ישירות תחת הטבלה.
              </li>
            </ul>
          </div>
          <div>
            <span className="font-semibold text-amber-400 block mb-1">
              טבלאות חשבונאיות:
            </span>
            <ul className="space-y-1 text-slate-400 text-[11px] list-disc list-inside">
              <li>
                שורת יחידת מטבע:{' '}
                <code className="text-amber-300 font-mono">| | י&quot;מ | י&quot;מ |</code>{' '}
                (תא ראשון ריק).
              </li>
              <li>
                שורת סיכום / קו תחתון כפול:{' '}
                <code className="text-amber-300 font-mono">סך הכול</code> או{' '}
                <code className="text-amber-300 font-mono">סה&quot;כ</code>.
              </li>
              <li>
                תרשים זרימה ובדיקות: הוסף בעמודות{' '}
                <code className="text-amber-300 font-mono">שלב ובדיקה</code> ו-
                <code className="text-amber-300 font-mono">אם כן</code>.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Main Textarea */}
      <div className="relative flex-1 p-2">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`הדבק כאן את פלט ה-Markdown של תרגום התקן...

דוגמה מהירה:
# IFRS 8 מגזרי פעילות - דוגמאות להמחשה

**IG1** תוכן הסעיף הראשון בסגנון הרשמי.

| מידע מגזרי | מגזר א' | סך הכול |
| :--- | :---: | :---: |
| | י"מ | י"מ |
| הכנסות | 1,000 | 1,000 |
| סך הכול | 1,000 | 1,000 |

(א) הערת שוליים לטבלה`}
          dir="rtl"
          spellCheck={false}
          className="w-full h-full p-4 bg-slate-950 text-slate-200 border border-slate-800 rounded-lg text-[13.5px] leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 placeholder:text-slate-600 transition selection:bg-amber-500 selection:text-slate-950"
        />
      </div>

      {/* Footer Status Bar */}
      <div className="px-3 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          <span>{lineCount} שורות</span>
          <span>·</span>
          <span>{wordCount} מילים</span>
          <span>·</span>
          <span>{charCount} תווים</span>
          {tableCount > 0 && (
            <>
              <span>·</span>
              <span className="text-amber-400 font-medium">
                {tableCount} {tableCount === 1 ? 'טבלה' : 'טבלאות'}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>שמור בזיכרון מקומי</span>
        </div>
      </div>
    </div>
  );
};
