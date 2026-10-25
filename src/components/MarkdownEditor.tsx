import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Trash2,
  Copy,
  Check,
  BookOpen,
  HelpCircle,
  ClipboardPaste,
  X,
  Undo2,
  Redo2,
  RefreshCw,
  Zap
} from 'lucide-react';
import { SAMPLE_IFRS8_MARKDOWN } from '../utils/sampleData';
import {
  HistoryState,
  createHistory,
  pushHistory,
  undoHistory,
  redoHistory,
} from '../utils/historyManager';

interface MarkdownEditorProps {
  value: string;
  onChange: (val: string) => void;
  onAutoClean: () => void;
  onLoadSample: (sample: string) => void;
  onClear: () => void;
  hasPendingChanges?: boolean;
  onApplyPreview?: () => void;
  autoSync?: boolean;
  onToggleAutoSync?: () => void;
  onNotify?: (msg: string) => void;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  onAutoClean,
  onLoadSample,
  onClear,
  hasPendingChanges = false,
  onApplyPreview,
  autoSync = false,
  onToggleAutoSync,
  onNotify,
}) => {
  const [copied, setCopied] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [showPasteNotice, setShowPasteNotice] = useState(false);
  const clearTimerRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Undo / Redo History Stack
  const [history, setHistory] = useState<HistoryState<string>>(() => createHistory(value));
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync external changes (like loading sample or auto-clean) into history
  useEffect(() => {
    if (value !== history.present) {
      setHistory((prev) => pushHistory(prev, value));
    }
  }, [value]);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const handleUndo = () => {
    const nextH = undoHistory(history);
    if (nextH !== history) {
      setHistory(nextH);
      onChange(nextH.present);
      onNotify?.('בוטל השינוי האחרון (אחורה)');
    }
  };

  const handleRedo = () => {
    const nextH = redoHistory(history);
    if (nextH !== history) {
      setHistory(nextH);
      onChange(nextH.present);
      onNotify?.('בוצע שוב (קדימה)');
    }
  };

  // User typing in textarea: update value and debounce push to history
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    onChange(newVal);

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }
    typingTimerRef.current = setTimeout(() => {
      setHistory((prev) => pushHistory(prev, newVal));
    }, 400);
  };

  // Keyboard shortcuts: Ctrl+Z (Undo), Ctrl+Y / Ctrl+Shift+Z (Redo), Ctrl+Enter (Apply)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onApplyPreview?.();
      }
    }
  };

  // Compute live stats
  const lineCount = value ? value.split('\n').length : 0;
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;
  const tableCount = (value.match(/^\|(?:\s*:?-+:?\s*\|)+\s*$/gm) || []).length;

  const handlePaste = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          onChange(text);
          setHistory((prev) => pushHistory(prev, text));
          setShowPasteNotice(false);
          onNotify?.('הטקסט הודבק בהצלחה מלוח הגזירים.');
          return;
        }
      } catch {
        // Permissions policy blocked readText in iframe
      }
    }

    setShowPasteNotice(true);
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
    onNotify?.('התיבה מוכנה לקליטה – לחץ כעת Ctrl+V במקלדת להחלפת הטקסט');
  };

  const handleClearClick = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      clearTimerRef.current = setTimeout(() => {
        setConfirmClear(false);
      }, 3000);
    } else {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      setConfirmClear(false);
      onClear();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
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

          {/* Apply Preview Button (אישור שינויים ועדכון התצוגה המקדימה) */}
          <button
            onClick={onApplyPreview}
            disabled={!hasPendingChanges}
            title={
              hasPendingChanges
                ? 'עדכן את התצוגה המקדימה עם השינויים האחרונים (Ctrl+Enter)'
                : 'התצוגה המקדימה מעודכנת ומסונכרנת'
            }
            className={`flex items-center gap-1.5 px-3 py-1 rounded transition font-medium ${
              hasPendingChanges
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20 animate-pulse'
                : 'bg-slate-800/80 text-slate-500 border border-slate-700/60 opacity-60 cursor-default'
            }`}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                hasPendingChanges ? 'animate-spin-slow text-slate-950' : 'text-slate-500'
              }`}
            />
            <span>{hasPendingChanges ? 'עדכן תצוגה מקדימה' : 'התצוגה מעודכנת'}</span>
            {hasPendingChanges && (
              <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
            )}
          </button>

          {/* Undo / Redo buttons (אחורה / קדימה לתיקון טעויות) */}
          <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded border border-slate-800">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              title="אחורה - בטל שינוי אחרון (Ctrl+Z)"
              className={`p-1.5 rounded transition ${
                canUndo
                  ? 'text-slate-200 hover:text-amber-400 hover:bg-slate-800'
                  : 'text-slate-600 cursor-not-allowed'
              }`}
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              title="קדימה - בצע שוב שינוי שבוטל (Ctrl+Y / Ctrl+Shift+Z)"
              className={`p-1.5 rounded transition ${
                canRedo
                  ? 'text-slate-200 hover:text-amber-400 hover:bg-slate-800'
                  : 'text-slate-600 cursor-not-allowed'
              }`}
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handlePaste}
            title="הדבק טקסט מלוח הגזירים (מחליף את התוכן הקיים בתיבה)"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <ClipboardPaste className="w-3.5 h-3.5 text-amber-400" />
            <span>הדבק</span>
          </button>

          <button
            onClick={() => onLoadSample(SAMPLE_IFRS8_MARKDOWN)}
            title="טען דוגמה מקיפה מתקן IFRS 8 מגזרי פעילות כולל טבלאות ותרשימי זרימה"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>טען דוגמה (IFRS 8 IG)</span>
          </button>

          {/* Upgraded Clean Button: ניקוי פלט AI */}
          <button
            onClick={onAutoClean}
            title="מסיר משפטי פתיחה של המודל, מוחק הערות מתרגם, וממיר כתב נטוי (*) להדגשה (**)"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition font-medium"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>ניקוי פלט AI</span>
          </button>

          {/* 2-Step Clear Button */}
          <button
            onClick={handleClearClick}
            title={confirmClear ? "לחץ שוב כדי למחוק את כל הטקסט" : "נקה את כל הטקסט בעורך"}
            className={`flex items-center gap-1 px-2.5 py-1 rounded transition font-medium ${
              confirmClear
                ? 'bg-rose-600 hover:bg-rose-500 text-white border border-rose-500 shadow-md animate-pulse'
                : 'bg-slate-800/80 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-800/50 text-slate-400 border border-slate-700'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{confirmClear ? 'לחץ שוב לאישור' : 'נקה'}</span>
          </button>
        </div>

        {/* Right Tools (in RTL, visually left) */}
        <div className="flex items-center gap-2">
          {/* Optional Live Sync toggle */}
          {onToggleAutoSync && (
            <button
              onClick={onToggleAutoSync}
              title={
                autoSync
                  ? 'עדכון חי פעיל (כל מקש מעדכן מיידית את התצוגה) - לחץ למעבר לעדכון ידני'
                  : 'עדכון ידני פעיל (התצוגה מתעדכנת רק באישור) - לחץ למעבר לעדכון אוטומטי'
              }
              className={`flex items-center gap-1 px-2 py-1 rounded transition border ${
                autoSync
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-300'
              }`}
            >
              <Zap className={`w-3 h-3 ${autoSync ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
              <span className="text-[11px]">עדכון חי: {autoSync ? 'פעיל' : 'כבוי'}</span>
            </button>
          )}

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

      {/* Prominent Banner when clipboard API was blocked: informs user to press Ctrl+V */}
      {showPasteNotice && (
        <div className="m-2 p-2.5 bg-amber-500/15 border border-amber-500/40 text-amber-200 rounded-lg text-xs flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-150 shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="font-semibold text-amber-200">
              התיבה מוכנה לקליטה – לחץ כעת Ctrl+V במקלדת להחלפת הטקסט
            </span>
          </div>
          <button
            onClick={() => setShowPasteNotice(false)}
            className="text-amber-300 hover:text-white p-0.5 rounded transition"
            title="סגור הודעה"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
                <code className="text-amber-300 font-david font-bold">**IG1**</code> או{' '}
                <code className="text-amber-300 font-david font-bold">**IE1**</code>.
              </li>
              <li>
                כותרת ראשית ממסגרת:{' '}
                <code className="text-amber-300 font-david font-bold"># שם התקן</code>.
              </li>
              <li>
                הערות שוליים לטבלה: פתח שורה ב-{' '}
                <code className="text-amber-300 font-david font-bold">(א)</code> או{' '}
                <code className="text-amber-300 font-david font-bold">(ב)</code> ישירות תחת הטבלה.
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
                <code className="text-amber-300 font-david font-bold">| | י&quot;מ | י&quot;מ |</code>{' '}
                (תא ראשון ריק).
              </li>
              <li>
                שורת סיכום / קו תחתון כפול:{' '}
                <code className="text-amber-300 font-david font-bold">סך הכול</code> או{' '}
                <code className="text-amber-300 font-david font-bold">סה&quot;כ</code>.
              </li>
              <li>
                תרשים זרימה ובדיקות: הוסף בעמודות{' '}
                <code className="text-amber-300 font-david font-bold">שלב ובדיקה</code> ו-
                <code className="text-amber-300 font-david font-bold">אם כן</code>.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Main Textarea */}
      <div className="relative flex-1 p-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          onPaste={() => setShowPasteNotice(false)}
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
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-slate-500">
            Ctrl+Enter לעדכון · Ctrl+Z לאחורה · Ctrl+Y לקדימה
          </span>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>שמור בזיכרון מקומי</span>
          </div>
        </div>
      </div>
    </div>
  );
};
