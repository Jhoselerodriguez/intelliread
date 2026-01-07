import { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChevronUp, ChevronDown, MessageSquare, PanelLeftClose, PanelLeft, FileText } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FeatureCards } from '@/components/FeatureCards';
import { PDFUploader } from '@/components/PDFUploader';
import { DocumentLibrary } from '@/components/DocumentLibrary';
import { PDFViewer } from '@/components/PDFViewer';
import { ChatInterface } from '@/components/ChatInterface';
import { APISettingsModal } from '@/components/APISettingsModal';
import { ProcessingProgress } from '@/components/ProcessingProgress';
import { Button } from '@/components/ui/button';
import { useDocuments } from '@/hooks/useDocuments';
import { useAPIKeys } from '@/hooks/useAPIKeys';
import { extractTextFromPDF, extractSections, generateChunks } from '@/lib/pdfProcessor';
import { generateEmbedding } from '@/lib/vectorSearch';
import { saveChunk, saveTable, getTablesByDocument } from '@/lib/db';
import type { Document, ExtractedTable } from '@/types';
import { toast } from 'sonner';

const CHAT_HEIGHT = 400;

const Index = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | undefined>();
  const [selectedDocument, setSelectedDocument] = useState<Document | undefined>();
  const [tables, setTables] = useState<ExtractedTable[]>([]);
  const [processingStatus, setProcessingStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [pendingQuestion, setPendingQuestion] = useState<string | undefined>();
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const { documents, addDocument, removeDocument, getDocumentById, refresh } = useDocuments();
  const { apiKeys, hasAnyKey, hasMandatoryKeys, availableProviders, updateAPIKeys } = useAPIKeys();

  // Load selected document
  useEffect(() => {
    const loadDocument = async () => {
      if (selectedDocumentId) {
        const doc = await getDocumentById(selectedDocumentId);
        setSelectedDocument(doc);
        
        if (doc) {
          const docTables = await getTablesByDocument(selectedDocumentId);
          setTables(docTables);
        }
      } else {
        setSelectedDocument(undefined);
        setTables([]);
      }
    };

    loadDocument();
  }, [selectedDocumentId, getDocumentById]);

  // Handle question from text selection
  const handleAskQuestion = useCallback((question: string) => {
    setPendingQuestion(question);
    // Expand chat if collapsed
    if (isChatCollapsed) {
      setIsChatCollapsed(false);
    }
  }, [isChatCollapsed]);

  const handleScrollToChat = useCallback(() => {
    // Expand chat if collapsed
    if (isChatCollapsed) {
      setIsChatCollapsed(false);
    }
    // Smooth scroll to chat section
    setTimeout(() => {
      chatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  }, [isChatCollapsed]);

  const handleInitialMessageSent = useCallback(() => {
    setPendingQuestion(undefined);
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    setIsProcessing(true);
    setProcessingStatus('Reading PDF file...');

    try {
      const documentId = uuidv4();
      const pdfBlob = new Blob([await file.arrayBuffer()], { type: 'application/pdf' });

      // Extract text from PDF (with Gemini API key for image analysis)
      const extraction = await extractTextFromPDF(pdfBlob, setProcessingStatus, {
        geminiApiKey: apiKeys?.geminiApiKey,
        onProgress: setProcessingStatus,
      });

      // Extract sections
      setProcessingStatus('Analyzing document structure...');
      const sections = extractSections(extraction.pages);

      // Generate themes from content
      setProcessingStatus('Extracting themes...');
      const themes = extractThemes(extraction.pages.map(p => p.text).join(' '));

      // Generate appropriate summary based on document type
      let summary = '';
      if (extraction.isImageBased) {
        summary = `This is an image-based document with ${extraction.imageOnlyPageCount} image page(s) out of ${extraction.pageCount} total pages. `;
        if (apiKeys?.geminiApiKey) {
          summary += `AI-powered image analysis was used to extract content descriptions.`;
        } else {
          summary += `Configure Gemini API in settings for AI-powered image analysis.`;
        }
      } else {
        summary = `This document contains ${extraction.wordCount.toLocaleString()} words across ${extraction.pageCount} pages.`;
        if (extraction.imageOnlyPageCount > 0) {
          summary += ` Includes ${extraction.imageOnlyPageCount} image-only page(s).`;
        }
      }

      // Create document
      const document: Document = {
        id: documentId,
        filename: file.name,
        title: extraction.title || file.name.replace('.pdf', ''),
        uploadDate: new Date(),
        pageCount: extraction.pageCount,
        wordCount: extraction.wordCount,
        pdfBlob,
        tableOfContents: [],
        themes,
        summary,
        sections,
      };

      // Save document
      setProcessingStatus('Saving document...');
      await addDocument(document);

      // Save tables
      for (const table of extraction.tables) {
        const tableWithDocId = { ...table, documentId };
        await saveTable(tableWithDocId);
      }

      // Generate and save chunks with embeddings
      setProcessingStatus('Creating searchable chunks...');
      const chunks = generateChunks(extraction.pages, sections, documentId);

      setProcessingStatus('Generating embeddings...');
      for (let i = 0; i < chunks.length; i++) {
        if (i % 10 === 0) {
          setProcessingStatus(`Generating embeddings (${i + 1}/${chunks.length})...`);
        }
        
        const embedding = generateEmbedding(chunks[i].text);
        await saveChunk({
          id: uuidv4(),
          documentId,
          ...chunks[i],
          startOffset: 0,
          endOffset: chunks[i].text.length,
          embedding,
        });
      }

      setProcessingStatus('Done!');
      setSelectedDocumentId(documentId);
      await refresh();
      toast.success('Document processed successfully');
    } catch (error: any) {
      console.error('Error processing PDF:', error);
      setProcessingStatus(`Error: ${error.message}`);
      toast.error(`Failed to process PDF: ${error.message}`);
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingStatus('');
      }, 1000);
    }
  }, [addDocument, refresh]);

  const handleDeleteDocument = useCallback(async (id: string) => {
    try {
      await removeDocument(id);
      if (selectedDocumentId === id) {
        setSelectedDocumentId(undefined);
      }
      toast.success('Document deleted successfully');
    } catch (err) {
      toast.error('Failed to delete document');
    }
  }, [removeDocument, selectedDocumentId]);

  const handleBackToUpload = useCallback(() => {
    setSelectedDocumentId(undefined);
  }, []);

  const toggleChatCollapse = () => {
    setIsChatCollapsed(!isChatCollapsed);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onOpenSettings={() => setIsSettingsOpen(true)} hasApiKeys={hasAnyKey} />

      <main className="flex-1 flex flex-col overflow-hidden">
        {!selectedDocument ? (
          // Upload view
          <div className="flex-1 flex flex-col overflow-auto">
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 p-6">
              <PDFUploader 
                onFileSelect={handleFileSelect} 
                isProcessing={isProcessing}
                hasMandatoryKeys={hasMandatoryKeys}
                onOpenSettings={() => setIsSettingsOpen(true)}
              />
              <DocumentLibrary
                documents={documents}
                selectedDocumentId={selectedDocumentId}
                onSelectDocument={setSelectedDocumentId}
                onDeleteDocument={handleDeleteDocument}
                onBackToUpload={handleBackToUpload}
                showBackButton={false}
              />
            </div>
            <FeatureCards />
          </div>
        ) : (
          // Document view - 2 column layout with fixed chat at bottom
          <div 
            ref={containerRef}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* Top section: Document Library + PDF Viewer */}
            <div 
              className="flex-1 flex gap-0 min-h-0 transition-all duration-300"
              style={{ 
                flex: isChatCollapsed ? 1 : `1 1 calc(100% - ${CHAT_HEIGHT}px)` 
              }}
            >

              {/* Collapsible sidebar */}
              <div 
                className={`border-r border-border overflow-hidden transition-all duration-300 ease-in-out flex-shrink-0 ${
                  isSidebarCollapsed ? 'w-16' : 'w-full lg:w-[280px]'
                }`}
              >
                {isSidebarCollapsed ? (
                  /* Collapsed rail - slim vertical icon strip */
                  <div className="h-full flex flex-col bg-card/50">
                    {/* Toggle button in dedicated header container */}
                    <div className="h-12 flex items-center justify-center border-b border-border/50">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleSidebar}
                        className="h-9 w-9 rounded-lg hover:bg-muted"
                        title="Expand sidebar"
                      >
                        <PanelLeft className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* PDF icons with proper spacing */}
                    <div className="flex-1 overflow-y-auto py-4">
                      <div className="flex flex-col items-center gap-3 px-2">
                        {documents.map((doc) => (
                          <button
                            key={doc.id}
                            onClick={() => setSelectedDocumentId(doc.id)}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                              selectedDocumentId === doc.id 
                                ? 'bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20' 
                                : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground'
                            }`}
                            title={doc.filename}
                          >
                            <FileText className="w-5 h-5" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Expanded sidebar */
                  <div className="h-full flex flex-col">
                    {/* Header with toggle button - separated container */}
                    <div className="h-12 flex items-center justify-end px-3 border-b border-border/50 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleSidebar}
                        className="h-8 w-8 rounded-lg hover:bg-muted hidden lg:flex"
                        title="Collapse sidebar"
                      >
                        <PanelLeftClose className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* Document library content */}
                    <div className="flex-1 overflow-hidden">
                      <DocumentLibrary
                        documents={documents}
                        selectedDocumentId={selectedDocumentId}
                        onSelectDocument={setSelectedDocumentId}
                        onDeleteDocument={handleDeleteDocument}
                        onBackToUpload={handleBackToUpload}
                        showBackButton={true}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Main content area */}
              <div className="overflow-hidden flex-1 relative">
                <PDFViewer 
                  document={selectedDocument} 
                  tables={tables} 
                  onAskQuestion={handleAskQuestion}
                  onScrollToChat={handleScrollToChat}
                />
              </div>
            </div>

            {/* Bottom section: Fixed Chat Interface (400px) */}
            <div 
              ref={chatRef}
              className="border-t border-border bg-background flex flex-col shrink-0"
              style={{ 
                height: isChatCollapsed ? 48 : CHAT_HEIGHT
              }}
            >

              {/* Chat content */}
              <div className={`flex-1 overflow-hidden ${isChatCollapsed ? 'hidden' : ''}`}>
                <ChatInterface
                  documentId={selectedDocumentId}
                  documentTitle={selectedDocument?.title}
                  apiKeys={apiKeys}
                  availableProviders={availableProviders}
                  onOpenSettings={() => setIsSettingsOpen(true)}
                  initialMessage={pendingQuestion}
                  onInitialMessageSent={handleInitialMessageSent}
                  onToggleCollapse={toggleChatCollapse}
                  isCollapsed={isChatCollapsed}
                />
              </div>

              {/* Collapsed state header */}
              {isChatCollapsed && (
                <div 
                  className="h-full flex items-center justify-between px-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={toggleChatCollapse}
                >
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Ask Questions (Click to expand)
                  </span>
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer hasMandatoryKeys={hasMandatoryKeys} />

      <APISettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKeys={apiKeys}
        onSave={updateAPIKeys}
      />

      <ProcessingProgress status={processingStatus} isVisible={isProcessing} />
    </div>
  );
};

// Helper function to extract themes from text
const extractThemes = (text: string): string[] => {
  const keywords = [
    'technology', 'business', 'finance', 'healthcare', 'education',
    'research', 'analysis', 'strategy', 'development', 'management',
    'innovation', 'data', 'security', 'compliance', 'operations',
    'marketing', 'sales', 'engineering', 'design', 'architecture',
  ];

  const textLower = text.toLowerCase();
  const found = keywords.filter(kw => textLower.includes(kw));

  // Also extract capitalized terms that appear multiple times
  const capitalizedMatches = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
  const termCounts = new Map<string, number>();
  capitalizedMatches.forEach(term => {
    if (term.length > 3) {
      termCounts.set(term, (termCounts.get(term) || 0) + 1);
    }
  });

  const frequentTerms = Array.from(termCounts.entries())
    .filter(([_, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([term]) => term);

  const allThemes = [...new Set([...found, ...frequentTerms])];
  return allThemes.slice(0, 8);
};

export default Index;
