import { useState } from 'react';
import { FileText, Hash, Files, ChevronDown, ChevronUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { TextSelectionPopup } from '@/components/TextSelectionPopup';
import type { Document, Section, ExtractedTable } from '@/types';

interface PDFViewerProps {
  document: Document;
  tables?: ExtractedTable[];
  onAskQuestion?: (question: string) => void;
  onScrollToChat?: () => void;
}

export const PDFViewer = ({ document, tables = [], onAskQuestion, onScrollToChat }: PDFViewerProps) => {
  const handleAskQuestion = (question: string) => {
    onAskQuestion?.(question);
  };

  return (
    <div className="panel-card h-full flex flex-col overflow-hidden">
      {/* Document Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-6 h-6 text-muted-foreground" />
              <h1 className="text-2xl font-bold text-foreground">{document.title}</h1>
            </div>
            <p className="text-sm text-primary mb-3">{document.filename}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Hash className="w-4 h-4" />
                {document.wordCount.toLocaleString()} words
              </span>
              <span className="flex items-center gap-1">
                <Files className="w-4 h-4" />
                {document.pageCount} pages
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="summary" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 pt-4">
          <TabsList className="tab-container w-full justify-start">
            <TabsTrigger value="summary" className="data-[state=active]:tab-active">
              Summary
            </TabsTrigger>
            <TabsTrigger value="fulltext" className="data-[state=active]:tab-active">
              Full Text
            </TabsTrigger>
            <TabsTrigger value="themes" className="data-[state=active]:tab-active">
              Themes
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1 px-6 py-4">
          <TabsContent value="summary" className="mt-0">
            <TextSelectionPopup onAskQuestion={handleAskQuestion} onScrollToChat={onScrollToChat}>
              <SummaryTab document={document} tables={tables} />
            </TextSelectionPopup>
          </TabsContent>
          
          <TabsContent value="fulltext" className="mt-0">
            <TextSelectionPopup onAskQuestion={handleAskQuestion} onScrollToChat={onScrollToChat}>
              <FullTextTab document={document} />
            </TextSelectionPopup>
          </TabsContent>
          
          <TabsContent value="themes" className="mt-0">
            <TextSelectionPopup onAskQuestion={handleAskQuestion} onScrollToChat={onScrollToChat}>
              <ThemesTab document={document} />
            </TextSelectionPopup>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};

const SummaryTab = ({ document, tables }: { document: Document; tables: ExtractedTable[] }) => {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));

  const toggleSection = (index: number) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedSections(new Set(document.sections?.map((_, i) => i) || []));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Document Overview */}
      <div className="section-card">
        <h2 className="text-lg font-semibold text-foreground mb-3">Document Overview</h2>
        <p className="text-muted-foreground">
          This document contains {document.wordCount.toLocaleString()} words across {document.pageCount} pages.
        </p>
      </div>

      {/* Key Sections */}
      {document.sections && document.sections.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Key Sections</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={collapseAll}>
                Collapse All
              </Button>
              <Button variant="outline" size="sm" onClick={expandAll}>
                Expand All
              </Button>
            </div>
          </div>
          
          <div className="space-y-3">
            {document.sections.map((section, idx) => (
              <div key={idx} className="border rounded-lg overflow-hidden bg-card shadow-sm">
                <button
                  onClick={() => toggleSection(idx)}
                  className="w-full p-4 bg-muted/30 hover:bg-muted/50 flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </div>
                    <h3 className="font-semibold text-left text-foreground group-hover:text-primary transition-colors">
                      {section.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {section.content.split(/\s+/).length} words
                    </span>
                    {expandedSections.has(idx) ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </button>
                
                {expandedSections.has(idx) && (
                  <div className="p-4 bg-card animate-fade-in">
                    <ul className="space-y-2">
                      {section.bulletPoints.map((point, pointIdx) => (
                        <li key={pointIdx} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tables - sorted by page order */}
      {tables.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">Extracted Tables</h2>
            <span className="text-sm text-muted-foreground">{tables.length} tables found</span>
          </div>
          <div className="space-y-4">
            {[...tables]
              .sort((a, b) => a.page - b.page)
              .map((table, idx) => (
              <div key={idx} className="border-2 border-border rounded-lg overflow-hidden bg-card shadow-sm">
                {/* Table Header */}
                <div className="bg-muted/30 px-4 py-3 flex justify-between items-center border-b border-border">
                  <div>
                    <span className="font-bold text-foreground">Table {idx + 1}</span>
                    <span className="text-muted-foreground ml-2">(Page {table.page})</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {table.data.length} rows × {table.headers.length} columns
                  </span>
                </div>
                
                {/* Table Content */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-muted/20">
                        {table.headers.map((header, hIdx) => (
                          <th key={hIdx} className="text-left font-bold p-3 border-b-2 border-border text-foreground">
                            {header || '-'}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.data.slice(0, 10).map((row, rIdx) => (
                        <tr 
                          key={rIdx} 
                          className={`${rIdx % 2 === 0 ? 'bg-card' : 'bg-muted/10'} hover:bg-muted/30 transition-colors`}
                        >
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-3 border-b border-border/50 text-muted-foreground">
                              {cell || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {table.data.length > 10 && (
                  <div className="px-4 py-2 bg-muted/20 text-sm text-muted-foreground border-t border-border">
                    +{table.data.length - 10} more rows
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const FullTextTab = ({ document }: { document: Document }) => {
  const formatContent = (content: string) => {
    const paragraphs = content.split(/\n\n+/);
    return paragraphs.map((para, idx) => {
      const trimmed = para.trim();
      if (!trimmed) return null;

      // Check if it's a list
      const lines = trimmed.split('\n');
      const isListParagraph = lines.every(line => /^[\-•*]\s/.test(line.trim()) || /^\d+\.\s/.test(line.trim()));

      if (isListParagraph) {
        return (
          <ul key={idx} className="list-disc list-inside ml-4 my-3 space-y-1">
            {lines.map((line, lineIdx) => (
              <li key={lineIdx} className="text-muted-foreground">
                {line.replace(/^[\-•*\d.]+\s*/, '')}
              </li>
            ))}
          </ul>
        );
      }

      // Check if it's a heading (short, possibly capitalized)
      const isHeading = trimmed.length < 100 && (
        /^[A-Z][A-Z\s]+$/.test(trimmed) ||
        trimmed.endsWith(':')
      );

      if (isHeading) {
        return (
          <h3 key={idx} className="text-lg font-bold mt-6 mb-3 text-foreground border-b-2 border-primary/20 pb-2">
            {trimmed}
          </h3>
        );
      }

      return (
        <p key={idx} className="text-muted-foreground leading-relaxed mb-4 text-justify">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {document.sections?.map((section, idx) => (
        <div key={idx} className="section-card">
          <h3 className="font-semibold text-foreground mb-4 text-lg border-b border-border pb-2">
            {section.title}
          </h3>
          <div className="prose prose-sm max-w-none">
            {formatContent(section.content)}
          </div>
        </div>
      ))}
    </div>
  );
};

const ThemesTab = ({ document }: { document: Document }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Document Themes</h2>
        <div className="flex flex-wrap gap-2">
          {document.themes?.map((theme, idx) => (
            <span
              key={idx}
              className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium"
            >
              {theme}
            </span>
          ))}
        </div>
      </div>

      <div className="section-card">
        <h3 className="font-semibold text-foreground mb-2">Document Statistics</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Total Words:</span>
            <span className="ml-2 font-medium text-foreground">{document.wordCount.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Total Pages:</span>
            <span className="ml-2 font-medium text-foreground">{document.pageCount}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Sections:</span>
            <span className="ml-2 font-medium text-foreground">{document.sections?.length || 0}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Themes:</span>
            <span className="ml-2 font-medium text-foreground">{document.themes?.length || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
