import React from 'react';
import { X, BookOpen, CheckCircle2 } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div
        className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full text-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        dir="rtl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white font-david">
              מדריך טיפוגרפיה ועריכת ספרי תקינה (המוסד הישראלי לתקינה)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-slate-300 leading-relaxed">
          <div className="border border-slate-800 rounded-lg p-3 bg-slate-950">
            <h3 className="font-bold text-amber-400 mb-1 text-sm">
              1. סעיפים תלויים (Hanging Indent)
            </h3>
            <p className="text-slate-400">
              בספרי התקינה הרשמיים, מספרי הסעיפים (כגון <strong>IG1</strong>, <strong>IE1</strong>, <strong>BC1</strong>, <strong>15</strong>) ממוקמים בעמודת שוליים ימנית ייעודית ברוחב 44pt, בעוד שגוף הפסקה מיושר לשני הצדדים (Justified) בעמודה השמאלית.
            </p>
          </div>

          <div className="border border-slate-800 rounded-lg p-3 bg-slate-950">
            <h3 className="font-bold text-amber-400 mb-1 text-sm">
              2. קו תחתון כפול לשורות סיכום חשבונאיות
            </h3>
            <p className="text-slate-400">
              שורות סיכום כגון &quot;סך הכול&quot;, &quot;סה&quot;כ&quot;, &quot;הכנסות הישות&quot; ו-&quot;נכסי הישות&quot; מקבלות אוטומטית <strong>קו עליון בודד (0.75pt) וקו תחתון כפול (3px double)</strong> – הסטנדרט החשבונאי המקובל בעולם ובפרסומי המוסד.
            </p>
          </div>

          <div className="border border-slate-800 rounded-lg p-3 bg-slate-950">
            <h3 className="font-bold text-amber-400 mb-1 text-sm">
              3. שורת יחידת מטבע (י&quot;מ)
            </h3>
            <p className="text-slate-400">
              שורה שבה התא הראשון ריק והשאר מציינים יחידות מטבע (י&quot;מ, אלפי ש&quot;ח) מוגדרת תחת כותרת הטבלה ומופרדת בקו תחתון ייעודי.
            </p>
          </div>

          <div className="border border-slate-800 rounded-lg p-3 bg-slate-950">
            <h3 className="font-bold text-amber-400 mb-1 text-sm">
              4. מחיקת כתב נטוי והמרתו להדגשה
            </h3>
            <p className="text-slate-400">
              עברית דפוס תקנית בתחום החשבונאות והמשפט אינה עושה שימוש בכתב נטוי (Italics), שכן אותיות עבריות נטויות פוגעות בקריאות. כלי ה-Auto-Clean ממיר כל כוכבית בודדת לכוכבית כפולה (מודגש).
            </p>
          </div>

          <div className="border border-slate-800 rounded-lg p-3 bg-slate-950">
            <h3 className="font-bold text-amber-400 mb-1 text-sm">
              5. הדפסה נקייה ל-PDF
            </h3>
            <p className="text-slate-400">
              כפתור &quot;הדפס / שמור ל-PDF&quot; פותח מסמך A4 מבודד עם הגדרות הדפסה תקניות ומפעיל את דיאלוג ההדפסה של מערכת ההפעלה לשמירה מדויקת ללא עיוותי מסגרת.
            </p>
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition"
          >
            הבנתי, תודה
          </button>
        </div>
      </div>
    </div>
  );
};
