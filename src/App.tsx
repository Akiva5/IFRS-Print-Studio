import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { MarkdownEditor } from './components/MarkdownEditor';
import { DocumentPreview } from './components/DocumentPreview';
import { SettingsModal } from './components/SettingsModal';
import { InfoModal } from './components/InfoModal';
import { DocumentSettings } from './types';
import { autoCleanMarkdown } from './utils/markdownCleaner';
import { parseDocument } from './utils/documentParser';
import { renderDocumentToHtml } from './utils/htmlRenderer';
import { printViaPopup } from './utils/printHelper';
import { SAMPLE_IFRS8_MARKDOWN } from './utils/sampleData';
import { CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

const STORAGE_KEY_MARKDOWN = 'ifrs_markdown_content_v3';
const STORAGE_KEY_SETTINGS = 'ifrs_settings_v2';

const DEFAULT_SETTINGS: DocumentSettings = {
  runningHeaderRight: 'IFRS 8 - מגזרי פעילות: הנחיות יישום ודוגמאות להמחשה',
  runningHeaderLeft: 'תקינה חשבונאית בינלאומית (IFRS)',
  hangingIndent: true,
  fontSizePt: 11.5,
  lineHeight: 1.48,
  marginMm: 18,
  showPageGuides: false,
  showPageNumbers: true,
  paperSize: 'A4',
};

export default function App() {
  // Load initial markdown from localStorage or use sample
  const [markdown, setMarkdown] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MARKDOWN);
      if (saved !== null && saved !== undefined) {
        return saved;
      }
    } catch {
      // LocalStorage access issues
    }
    return SAMPLE_IFRS8_MARKDOWN;
  });

  // Load initial settings
  const [settings, setSettings] = useState<DocumentSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_SETTINGS;
  });

  const [activeTabMobile, setActiveTabMobile] = useState<'editor' | 'preview'>('preview');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-save markdown to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MARKDOWN, markdown);
    } catch {
      // ignore
    }
  }, [markdown]);

  // Auto-save settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3500);
  }, []);

  // Parse document blocks
  const blocks = useMemo(() => {
    return parseDocument(markdown);
  }, [markdown]);

  // Extract document title from first h1 block if available
  const documentTitle = useMemo(() => {
    const firstH1 = blocks.find((b) => b.type === 'h1');
    if (firstH1 && firstH1.type === 'h1') {
      return firstH1.text;
    }
    return settings.runningHeaderRight || 'IFRS Standard Document';
  }, [blocks, settings.runningHeaderRight]);

  const handleUpdateSettings = (newSettings: Partial<DocumentSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleAutoClean = () => {
    const cleaned = autoCleanMarkdown(markdown);
    if (cleaned !== markdown) {
      setMarkdown(cleaned);
      showToast('הטקסט נוקה: הוסרו הקדמות AI והערות מתרגם, והומרו הטיות להדגשה.');
    } else {
      showToast('הטקסט כבר תקין ונקי לפי כללי התקינה.');
    }
  };

  const handleLoadSample = (sampleText: string) => {
    setMarkdown(sampleText);
    showToast('נטענה דוגמה רשמית של IFRS 8 מגזרי פעילות.');
  };

  const handleClear = () => {
    if (window.confirm('האם למחוק את כל הטקסט בעורך?')) {
      setMarkdown('');
      showToast('העורך נוקה.');
    }
  };

  // Dedicated Print Popup implementation
  const handlePrintPopup = () => {
    const renderedHtml = renderDocumentToHtml(blocks, settings);
    const success = printViaPopup(renderedHtml, settings, documentTitle);
    if (!success) {
      showToast('חלון ההדפסה נחסם על-ידי הדפדפן. מפעיל הדפסה מקומית במקום...');
      window.print();
    }
  };

  const handlePrintFallback = () => {
    window.print();
  };

  // Download Standalone HTML file
  const handleDownloadHtml = () => {
    const renderedHtml = renderDocumentToHtml(blocks, settings);
    const fullHtml = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>${documentTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=David+Libre:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    @page { size: A4 portrait; margin: ${settings.marginMm}mm 20mm; }
    body { font-family: 'David Libre', 'David', serif; font-size: ${settings.fontSizePt}pt; line-height: ${settings.lineHeight}; color: #000; background: #fff; text-align: justify; direction: rtl; }
    .running-header { display: flex; justify-content: space-between; border-bottom: 0.75pt solid #000; padding-bottom: 3pt; margin-bottom: 16pt; font-size: 9pt; }
    .standard-title { border-top: 1.5pt solid #000; border-bottom: 1.5pt solid #000; font-size: 15.5pt; font-weight: bold; padding: 6pt 0; margin: 14pt 0 16pt 0; text-align: right; }
    .section-h2 { font-size: 13pt; font-weight: bold; margin: 16pt 0 6pt 0; }
    .section-h3 { font-size: 11.5pt; font-weight: bold; margin: 12pt 0 4pt 0; }
    .hanging-grid { display: grid; grid-template-columns: 44pt 1fr; gap: 4pt; margin-bottom: 7.5pt; text-align: justify; }
    .hanging-code { font-weight: bold; text-align: right; }
    .hanging-body { text-align: justify; }
    .table-footnote { font-size: 9.5pt; line-height: 1.35; margin: 3.5pt 0; }
    table.ifrs-table { width: 100%; border-collapse: collapse; margin: 12pt 0 8pt 0; font-size: 10pt; }
    table.table-accounting thead th { border-top: 1.2pt solid #000; border-bottom: 0.75pt solid #000; padding: 4.5pt 6pt; font-weight: bold; text-align: center; }
    table.table-accounting thead th:first-child { text-align: right; }
    table.table-accounting td { padding: 3.5pt 6pt; }
    table.table-accounting tr.unit-row td { border-bottom: 0.75pt solid #000; font-size: 9.5pt; text-align: center; }
    table.table-accounting tr.subheader-row td:first-child { font-weight: bold; text-align: right; padding-top: 8pt; }
    table.table-accounting tr.summary-row td { border-top: 0.75pt solid #000 !important; border-bottom: 3px double #000 !important; font-weight: bold !important; }
    table.table-decision { border: 0.5pt solid #000; }
    table.table-decision th, table.table-decision td { border: 0.5pt solid #000; padding: 5pt 7pt; }
    table.table-decision thead th { background: #f2f2f2; }
    .num-cell { direction: ltr !important; display: inline-block; font-variant-numeric: tabular-nums; }
    .align-center { text-align: center !important; }
    .align-right { text-align: right !important; }
    .align-left { text-align: left !important; }
  </style>
</head>
<body>
  ${renderedHtml}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${documentTitle.replace(/[\/\\?%*:|"<>]/g, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('קובץ ה-HTML הורד בהצלחה.');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans" dir="rtl">
      {/* Top Header Toolbar */}
      <div className="no-print">
        <Header
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onPrintPopup={handlePrintPopup}
          onPrintFallback={handlePrintFallback}
          onDownloadHtml={handleDownloadHtml}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenInfo={() => setIsInfoOpen(true)}
        />
      </div>

      {/* Mobile Tab Switcher */}
      <div className="md:hidden flex border-b border-slate-800 bg-slate-900 text-xs no-print">
        <button
          onClick={() => setActiveTabMobile('preview')}
          className={`flex-1 py-2 text-center font-medium transition ${
            activeTabMobile === 'preview'
              ? 'text-amber-400 border-b-2 border-amber-400 bg-slate-800/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          תצוגת A4 דפוס
        </button>
        <button
          onClick={() => setActiveTabMobile('editor')}
          className={`flex-1 py-2 text-center font-medium transition ${
            activeTabMobile === 'editor'
              ? 'text-amber-400 border-b-2 border-amber-400 bg-slate-800/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          עורך מקור (Markdown)
        </button>
      </div>

      {/* Split-Screen Main Workspace (RTL: Column 1 is Right 42%, Column 2 is Left 58%) */}
      <main
        className="flex-1 grid grid-cols-1 md:grid-cols-[42%_58%] overflow-hidden"
        style={{ gridTemplateColumns: undefined }}
        dir="rtl"
      >
        {/* Right Pane (Markdown Source Editor - 42% on the RIGHT) */}
        <section
          className={`w-full h-full overflow-hidden ${
            activeTabMobile === 'editor' ? 'flex flex-col' : 'hidden md:flex md:flex-col'
          }`}
        >
          <MarkdownEditor
            value={markdown}
            onChange={setMarkdown}
            onAutoClean={handleAutoClean}
            onLoadSample={handleLoadSample}
            onClear={handleClear}
            onNotify={showToast}
          />
        </section>

        {/* Left Pane (Live A4 Preview - 58% on the LEFT) */}
        <section
          className={`w-full h-full overflow-hidden border-r border-slate-800 ${
            activeTabMobile === 'preview' ? 'flex flex-col' : 'hidden md:flex md:flex-col'
          }`}
        >
          <DocumentPreview
            blocks={blocks}
            settings={settings}
            rawMarkdown={markdown}
          />
        </section>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Info Modal */}
      <InfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 text-slate-100 border border-slate-700 shadow-xl text-xs animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
