import React from 'react';
import {
  Printer,
  Sliders,
  FileText,
  AlignRight,
  BookOpen,
  Download,
  Info
} from 'lucide-react';
import { DocumentSettings } from '../types';

interface HeaderProps {
  settings: DocumentSettings;
  onUpdateSettings: (newSettings: Partial<DocumentSettings>) => void;
  onPrintPopup: () => void;
  onDownloadHtml: () => void;
  onOpenSettings: () => void;
  onOpenInfo: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onUpdateSettings,
  onPrintPopup,
  onDownloadHtml,
  onOpenSettings,
  onOpenInfo,
}) => {
  return (
    <header className="bg-slate-950 border-b border-slate-800 text-slate-100 select-none z-30">
      <div className="max-w-7xl mx-auto px-4 h-15 flex items-center justify-between gap-4">
        {/* Brand Lockup */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm tracking-wider">
            IFRS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white font-david">
                IFRS Print Studio
              </span>
              <span className="hidden sm:inline-block text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                סגנון המוסד הישראלי לתקינה
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">
              מערכת סדר והפקת דפוס לספרי תקינה חשבונאית בינלאומית
            </p>
          </div>
        </div>

        {/* Quick Toolbar Toggles */}
        <div className="hidden lg:flex items-center gap-2 text-xs">
          {/* Hanging Paragraph Toggle */}
          <button
            onClick={() => onUpdateSettings({ hangingIndent: !settings.hangingIndent })}
            title="הפעל או נטרל סעיפים תלויים ברוחב 44pt"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded transition border ${
              settings.hangingIndent
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlignRight className="w-3.5 h-3.5" />
            <span>סעיפים תלויים: {settings.hangingIndent ? 'מופעל' : 'רגיל'}</span>
          </button>

          {/* Font Size Quick Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300">
            <span className="text-[11px] text-slate-400 ml-1.5">גודל גופן:</span>
            <select
              value={settings.fontSizePt}
              onChange={(e) => onUpdateSettings({ fontSizePt: parseFloat(e.target.value) })}
              className="bg-transparent text-amber-400 font-medium focus:outline-none cursor-pointer"
            >
              <option value="10.5" className="bg-slate-900 text-slate-200">10.5pt</option>
              <option value="11" className="bg-slate-900 text-slate-200">11.0pt</option>
              <option value="11.5" className="bg-slate-900 text-slate-200">11.5pt (רשמי)</option>
              <option value="12" className="bg-slate-900 text-slate-200">12.0pt</option>
            </select>
          </div>

          {/* Running Header Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300">
            <span className="text-[11px] text-slate-400 ml-1.5">דף:</span>
            <span className="text-amber-400 font-mono">A4</span>
          </div>

          {/* Advanced Settings Modal button */}
          <button
            onClick={onOpenSettings}
            title="הגדרות מתקדמות לכותרות ושוליים"
            className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Info Modal button */}
          <button
            onClick={onOpenInfo}
            title="מדריך כללי עימוד וסגנון המוסד לתקינה"
            className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls & Primary CTA */}
        <div className="flex items-center gap-2">
          {/* Download Standalone HTML */}
          <button
            onClick={onDownloadHtml}
            title="הורד קובץ HTML עצמאי לעריכה ולהדפסה"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 text-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>שמור HTML</span>
          </button>

          {/* Dedicated Print Popup Button - Primary Requirement */}
          <button
            onClick={onPrintPopup}
            title="פותח חלון הדפסה נקי ומבודד התואם דפי A4 בדיוק מושלם"
            className="flex items-center gap-2 px-4 py-2 rounded font-semibold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-md shadow-amber-500/20 active:scale-95"
          >
            <Printer className="w-4 h-4 text-slate-950" />
            <span>הדפס / שמור ל-PDF</span>
          </button>
        </div>
      </div>
    </header>
  );
};
