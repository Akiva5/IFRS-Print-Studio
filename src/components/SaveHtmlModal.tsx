import React, { useState, useEffect } from 'react';
import { X, Download, FileCode } from 'lucide-react';

interface SaveHtmlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (fileName: string) => void;
  defaultTitle: string;
}

export const SaveHtmlModal: React.FC<SaveHtmlModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultTitle,
}) => {
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Clean and generate default filename from title
      const cleanName = (defaultTitle || 'IFRS_Standard')
        .trim()
        .replace(/[\\/:*?"<>|]/g, '')
        .replace(/\s+/g, '_');
      setFileName(cleanName.endsWith('.html') ? cleanName : `${cleanName}.html`);
    }
  }, [isOpen, defaultTitle]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = fileName.trim() || 'IFRS_Standard.html';
    onSave(finalName.endsWith('.html') ? finalName : `${finalName}.html`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div
        className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full text-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        dir="rtl"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white font-david">
              שמירת קובץ HTML
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              שם הקובץ לשמירה:
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="IFRS_8_IG.html"
              autoFocus
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-amber-500 font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              הקובץ כולל את כל הגדרות העימוד, הגופנים והטבלאות לתצוגה ולהדפסה מושלמת בכל דפדפן.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>הורד קובץ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
