import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  Eye,
  Columns,
  Maximize2,
  Minimize2,
  FileText
} from 'lucide-react';
import { DocumentBlock, DocumentSettings, ParsedTable, TableRow } from '../types';
import { paginateBlocks } from '../utils/paginator';

interface DocumentPreviewProps {
  blocks: DocumentBlock[];
  settings: DocumentSettings;
  rawMarkdown: string;
}

type ZoomMode = 'fit-width' | 'fit-page' | '100';

const A4_WIDTH_PX = 794; // approx 210mm at 96 DPI
const A4_HEIGHT_PX = 1123; // approx 297mm at 96 DPI

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  blocks,
  settings,
  rawMarkdown,
}) => {
  // Zoom mode state: default to 'fit-width' (התאמה לרוחב) on initial load!
  const [zoomMode, setZoomMode] = useState<ZoomMode>('fit-width');
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Paginate blocks into separate A4 pages based on ~245mm net content capacity
  const pages = useMemo(() => {
    return paginateBlocks(blocks, settings);
  }, [blocks, settings]);

  // ResizeObserver to calculate exact scale dynamically so A4 is never clipped
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      setContainerSize({
        width: el.clientWidth,
        height: el.clientHeight,
      });
    };

    updateSize();

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect) {
          setContainerSize({
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        }
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Compute scale based on zoomMode and measured container dimensions
  const scale = useMemo(() => {
    if (zoomMode === '100') return 1.0;

    const availableWidth = Math.max(100, containerSize.width - 48);
    const availableHeight = Math.max(100, containerSize.height - 48);

    if (zoomMode === 'fit-width') {
      if (containerSize.width === 0) return 0.85; // Initial render fallback
      return Math.max(0.35, availableWidth / A4_WIDTH_PX);
    }

    if (zoomMode === 'fit-page') {
      if (containerSize.width === 0 || containerSize.height === 0) return 0.65;
      const scaleW = availableWidth / A4_WIDTH_PX;
      const scaleH = availableHeight / A4_HEIGHT_PX;
      return Math.max(0.35, Math.min(scaleW, scaleH));
    }

    return 1.0;
  }, [zoomMode, containerSize]);

  const isEmpty = blocks.length === 0;

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden select-text">
      {/* Preview Control Bar */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-semibold text-white">
            תצוגה מקדימה - עמוד A4 דפוס
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            ({pages.length} {pages.length === 1 ? 'עמוד' : 'עמודים'})
          </span>
        </div>

        {/* 3 Zoom Mode Controls: התאמה לרוחב (ברירת מחדל), התאמה לאורך, 100% */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setZoomMode('fit-width')}
            title="התאמת רוחב הדף לחלון התצוגה (מונע חיתוך)"
            className={`px-2.5 py-1 rounded transition font-medium ${
              zoomMode === 'fit-width'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            התאמה לרוחב
          </button>

          <button
            onClick={() => setZoomMode('fit-page')}
            title="התאמת עמוד שלם לאורך החלון"
            className={`px-2.5 py-1 rounded transition font-medium ${
              zoomMode === 'fit-page'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            התאמה לאורך (עמוד שלם)
          </button>

          <button
            onClick={() => setZoomMode('100')}
            title="הצגה בגודל מקורי 100%"
            className={`px-2.5 py-1 rounded transition font-medium ${
              zoomMode === '100'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            100%
          </button>

          <span className="text-[11px] font-mono text-slate-400 px-1 border-r border-slate-800">
            {Math.round(scale * 100)}%
          </span>
        </div>
      </div>

      {/* Workspace Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4 md:p-6 flex flex-col items-center bg-slate-950/80"
        style={{ minWidth: 0 }}
      >
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center text-center p-8 text-slate-500 max-w-sm m-auto">
            <Columns className="w-12 h-12 mb-3 text-slate-700 stroke-1" />
            <h3 className="text-base font-semibold text-slate-400 mb-1">
              אין תוכן להצגה כרגע
            </h3>
            <p className="text-xs text-slate-500">
              הדבק תוכן Markdown בעורך מימין, או לחץ על &quot;טען דוגמה (IFRS 8 IG)&quot;.
            </p>
          </div>
        ) : (
          <div
            style={{
              width: `${A4_WIDTH_PX * scale}px`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transition: 'width 0.15s ease-out',
            }}
            className="mx-auto print-only-target"
          >
            <div
              style={{
                width: '210mm',
                transform: `scale(${scale})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out',
              }}
            >
              {/* Render each separate A4 Page with Running Header and Running Footer */}
              {pages.map((pageBlocks, pageIdx) => (
                <div
                  key={pageIdx}
                  className="bg-white text-black font-david relative flex flex-col"
                  style={{
                    width: '210mm',
                    minHeight: '297mm',
                    paddingTop: `${settings.marginMm}mm`,
                    paddingBottom: `${settings.marginMm}mm`,
                    paddingRight: '20mm',
                    paddingLeft: '20mm',
                    boxSizing: 'border-box',
                    fontSize: `${settings.fontSizePt}pt`,
                    lineHeight: settings.lineHeight,
                    marginBottom: '28px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
                    border: '1px solid #94a3b8',
                  }}
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

                  {/* Running Header on every page */}
                  {(settings.runningHeaderRight || settings.runningHeaderLeft) && (
                    <div className="flex justify-between items-center border-b border-black pb-1 mb-4 text-[9.5pt] select-none shrink-0">
                      <div className="font-medium text-black">
                        {settings.runningHeaderRight}
                      </div>
                      <div className="font-normal text-black font-david">
                        {settings.runningHeaderLeft}
                      </div>
                    </div>
                  )}

                  {/* Page Blocks Content */}
                  <div className="flex-1 space-y-2.5">
                    {pageBlocks.map((block, bIdx) => (
                      <BlockRenderer
                        key={bIdx}
                        block={block}
                        settings={settings}
                      />
                    ))}
                  </div>

                  {/* Running Footer on every page */}
                  <div className="mt-auto pt-2 border-t border-black text-[9pt] flex justify-center items-center select-none shrink-0 text-black">
                    <span>עמוד {pageIdx + 1} מתוך {pages.length}</span>
                  </div>
                </div>
              ))}
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
