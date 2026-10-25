import React from 'react';
import { X, Check } from 'lucide-react';
import { DocumentSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DocumentSettings;
  onUpdateSettings: (newSettings: Partial<DocumentSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div
        className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full text-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div>
            <h2 className="text-base font-bold text-white font-david">
              הגדרות עימוד ותקני דפוס
            </h2>
            <p className="text-xs text-slate-400">
              התאמת פרמטרי הדפוס לסגנון המוסד הישראלי לתקינה
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Running Header Right */}
          <div>
            <label className="block font-medium text-slate-300 mb-1">
              כותרת ראש (צד ימין - שם התקן או הדוח):
            </label>
            <input
              type="text"
              value={settings.runningHeaderRight}
              onChange={(e) => onUpdateSettings({ runningHeaderRight: e.target.value })}
              placeholder="לדוגמה: IFRS 8 - מגזרי פעילות"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-amber-500 font-david text-sm"
            />
          </div>

          {/* Running Header Left */}
          <div>
            <label className="block font-medium text-slate-300 mb-1">
              כותרת ראש (צד שמאל - תקן בינלאומי / מוסד):
            </label>
            <input
              type="text"
              value={settings.runningHeaderLeft}
              onChange={(e) => onUpdateSettings({ runningHeaderLeft: e.target.value })}
              placeholder="תקינה חשבונאית בינלאומית (IFRS)"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-amber-500 font-david text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            {/* Font Size */}
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                גודל גופן גוף (נקודות pt):
              </label>
              <select
                value={settings.fontSizePt}
                onChange={(e) => onUpdateSettings({ fontSizePt: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="10.5">10.5 pt</option>
                <option value="11">11.0 pt</option>
                <option value="11.5">11.5 pt (תקן רשמי)</option>
                <option value="12">12.0 pt</option>
              </select>
            </div>

            {/* Line Height */}
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                מרווח בין שורות (Line-Height):
              </label>
              <select
                value={settings.lineHeight}
                onChange={(e) => onUpdateSettings({ lineHeight: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="1.4">1.40 (צפוף)</option>
                <option value="1.48">1.48 (תקן רשמי)</option>
                <option value="1.55">1.55 (מרווח)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Margins */}
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                שוליים עליונים ותחתונים (מ"מ):
              </label>
              <select
                value={settings.marginMm}
                onChange={(e) => onUpdateSettings({ marginMm: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="15">15 מ&quot;מ</option>
                <option value="18">18 מ&quot;מ (תקן דפוס)</option>
                <option value="20">20 מ&quot;מ</option>
                <option value="25">25 מ&quot;מ</option>
              </select>
            </div>

            {/* Paper Size */}
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                גודל דף:
              </label>
              <select
                value={settings.paperSize}
                onChange={(e) => onUpdateSettings({ paperSize: e.target.value as 'A4' | 'Letter' })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="A4">A4 (210 x 297 mm)</option>
                <option value="Letter">US Letter</option>
              </select>
            </div>
          </div>

          {/* Toggles */}
          <div className="pt-2 space-y-2 border-t border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.hangingIndent}
                onChange={(e) => onUpdateSettings({ hangingIndent: e.target.checked })}
                className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
              />
              <span className="text-slate-200">
                הפעל סעיפים תלויים ברוחב 44pt (עמודת קוד סעיף מופרדת מימין)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.showPageGuides}
                onChange={(e) => onUpdateSettings({ showPageGuides: e.target.checked })}
                className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
              />
              <span className="text-slate-200">
                הצג קווי עזר לשוליים בתצוגה המקדימה
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition"
          >
            <Check className="w-3.5 h-3.5" />
            <span>סגור ושמור</span>
          </button>
        </div>
      </div>
    </div>
  );
};
