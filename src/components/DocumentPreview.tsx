import React, { useRef, useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileCheck,
  Eye,
  Columns
} from 'lucide-react';
import { DocumentBlock, DocumentSettings, ParsedTable, TableRow } from '../types';

interface DocumentPreviewProps {
  blocks: DocumentBlock[];
  settings: DocumentSettings;
  rawMarkdown: string;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  blocks,
  settings,
  rawMarkdown,
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 60));
  const handleResetZoom = () => setZoom(100);

  const isEmpty = blocks.length === 0;

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden select-text">
      {/* Preview Control Bar */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-white">
            תצוגה מקדימה - עמוד A4 דפוס
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            (מבוסס תקני הדפוס של המוסד הישראלי לתקינה)
          </span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleZoomOut}
            title="הקטן תצוגה"
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetZoom}
            title="איפוס ל-100%"
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 font-mono text-[11px] text-amber-400 font-medium transition min-w-[45px] text-center"
          >
            {zoom}%
          </button>
          <button
            onClick={handleZoomIn}
            title="הגדל תצוגה"
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Workspace Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4 md:p-8 flex justify-center bg-slate-950/80"
      >
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center text-center p-8 text-slate-500 max-w-sm m-auto">
            <Columns className="w-12 h-12 mb-3 text-slate-700 stroke-1" />
            <h3 className="text-base font-semibold text-slate-400 mb-1">
              אין תוכן להצגה כרגע
            </h3>
            <p className="text-xs text-slate-500">
              הדבק תוכן Markdown של תרגום התקן בעורך מימין, או לחץ על &quot;טען דוגמה (IFRS 8 IG)&quot; כדי לראות את העימוד המלא.
            </p>
          </div>
        ) : (
          <div
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out',
            }}
            className="print-only-target"
          >
            {/* The A4 Page Container */}
            <div
              style={{
                width: '210mm',
                minHeight: '297mm',
                paddingTop: `${settings.marginMm}mm`,
                paddingBottom: `${settings.marginMm}mm`,
                paddingRight: '20mm',
                paddingLeft: '20mm',
                fontSize: `${settings.fontSizePt}pt`,
                lineHeight: settings.lineHeight,
              }}
              className="bg-white text-black font-david shadow-2xl relative transition-all rounded-xs border border-slate-300"
              dir="rtl"
            >
              {/* Optional Margins Guide Overlay */}
              {settings.showPageGuides && (
                <div
                  className="pointer-events-none absolute inset-0 border border-dashed border-sky-300/40"
                  style={{
                    top: `${settings.marginMm}mm`,
                    bottom: `${settings.marginMm}mm`,
                    right: '20mm',
                    left: '20mm',
                  }}
                />
              )}

              {/* Running Header */}
              {(settings.runningHeaderRight || settings.runningHeaderLeft) && (
                <div className="flex justify-between items-center border-b border-black pb-1 mb-5 text-[9.5pt] select-none">
                  <div className="font-medium text-black">
                    {settings.runningHeaderRight}
                  </div>
                  <div className="font-normal text-black font-david">
                    {settings.runningHeaderLeft}
                  </div>
                </div>
              )}

              {/* Document Blocks */}
              <div className="space-y-2.5">
                {blocks.map((block, idx) => (
                  <BlockRenderer
                    key={idx}
                    block={block}
                    settings={settings}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface BlockRendererProps {
  block: DocumentBlock;
  settings: DocumentSettings;
}

const BlockRenderer: React.FC<BlockRendererProps> = ({ block, settings }) => {
  switch (block.type) {
    case 'h1':
      return (
        <h1
          id={block.id}
          className="border-t-[1.5pt] border-b-[1.5pt] border-black font-bold text-[15.5pt] py-2 my-4 text-right leading-tight tracking-tight"
        >
          {renderFormattedInline(block.text)}
        </h1>
      );

    case 'h2':
      return (
        <h2
          id={block.id}
          className="font-bold text-[13pt] mt-4 mb-1.5 text-right leading-snug"
        >
          {renderFormattedInline(block.text)}
        </h2>
      );

    case 'h3':
      return (
        <h3
          id={block.id}
          className="font-bold text-[11.5pt] mt-3 mb-1 text-right"
        >
          {renderFormattedInline(block.text)}
        </h3>
      );

    case 'hanging_paragraph':
      if (settings.hangingIndent) {
        return (
          <div
            className="grid gap-2 mb-2 text-justify"
            style={{ gridTemplateColumns: '44pt 1fr' }}
          >
            <div className="font-bold text-right select-none whitespace-nowrap">
              {block.code}
            </div>
            <div className="text-justify leading-relaxed">
              {renderFormattedInline(block.body)}
            </div>
          </div>
        );
      }
      return (
        <p className="text-justify mb-2 leading-relaxed">
          <strong className="font-bold ml-1.5">{block.code}</strong>
          {renderFormattedInline(block.body)}
        </p>
      );

    case 'paragraph':
      return (
        <p className="text-justify mb-2 leading-relaxed">
          {renderFormattedInline(block.text)}
        </p>
      );

    case 'table':
      return <TableView table={block.table} />;

    case 'footnote':
      return (
        <div className="flex gap-2 text-[9.5pt] leading-tight text-slate-900 my-1">
          <span className="font-bold flex-shrink-0">{block.marker}</span>
          <span className="text-justify">{renderFormattedInline(block.text)}</span>
        </div>
      );

    case 'quote':
      return (
        <blockquote className="border-r-2 border-black pr-3 my-2 text-slate-800">
          {renderFormattedInline(block.text)}
        </blockquote>
      );

    case 'hr':
      return <hr className="border-t-[0.5pt] border-black my-4" />;

    default:
      return null;
  }
};

const TableView: React.FC<{ table: ParsedTable }> = ({ table }) => {
  const isDecision = table.type === 'decision';

  return (
    <div className="my-3 overflow-x-auto">
      <table
        className={`w-full border-collapse text-[10pt] ${
          isDecision ? 'border border-black' : ''
        }`}
        dir="rtl"
      >
        <thead>
          <tr
            className={
              isDecision
                ? 'bg-neutral-100 border-b border-black'
                : 'border-t-[1.2pt] border-b-[0.75pt] border-black font-bold'
            }
          >
            {table.headers.map((h, idx) => (
              <th
                key={idx}
                className={`py-1.5 px-2 font-bold ${
                  isDecision ? 'border border-black' : ''
                } ${
                  idx === 0
                    ? 'text-right'
                    : h.align === 'left'
                    ? 'text-left'
                    : 'text-center'
                }`}
              >
                {renderFormattedInline(h.text)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row: TableRow, rIdx: number) => {
            let rowClasses = '';
            let rowStyle: React.CSSProperties = {};

            if (row.isUnitRow) {
              rowClasses += ' border-b-[0.75pt] border-black text-[9.5pt]';
            } else if (row.isSummaryRow) {
              rowClasses += ' font-bold';
              rowStyle = {
                borderTop: '0.75pt solid #000000',
                borderBottom: '3px double #000000',
              };
            }

            return (
              <tr
                key={rIdx}
                className={rowClasses}
                style={rowStyle}
              >
                {row.cells.map((cell, cIdx) => {
                  let alignClass = 'text-center';
                  if (cIdx === 0 || row.isSubheader) {
                    alignClass = 'text-right';
                  } else if (cell.align === 'left') {
                    alignClass = 'text-left';
                  }

                  const borderClass = isDecision ? 'border border-black p-1.5' : 'py-1 px-2';
                  const isFirstSubheader = row.isSubheader && cIdx === 0;

                  return (
                    <td
                      key={cIdx}
                      className={`${alignClass} ${borderClass} ${
                        isFirstSubheader ? 'font-bold pt-2.5 pb-0.5' : ''
                      }`}
                    >
                      {cell.isNumeric ? (
                        <span
                          className="num-cell"
                          dir="ltr"
                        >
                          {renderFormattedInline(cell.text)}
                        </span>
                      ) : (
                        renderFormattedInline(cell.text)
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Helper to render inline **bold** text into strong tags
 */
function renderFormattedInline(text: string): React.ReactNode {
  if (!text) return null;

  // Split by **text**
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={index} className="font-bold">
          {part.substring(2, part.length - 2)}
        </strong>
      );
    }
    return part;
  });
}
