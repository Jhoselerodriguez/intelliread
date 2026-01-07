import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, ChevronDown, ChevronUp, Settings, Loader2, MoreVertical, Download, Trash2, ExternalLink } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { AIProvider, ChatMessage, APIKeys, Document } from '@/types';
import { useChat } from '@/hooks/useChat';
import { deleteChatHistory } from '@/lib/db';
import { toast } from 'sonner';

interface ChatInterfaceProps {
  documentId: string | undefined;
  documentTitle?: string;
  apiKeys: APIKeys | undefined;
  availableProviders: AIProvider[];
  onOpenSettings: () => void;
  initialMessage?: string;
  onInitialMessageSent?: () => void;
  onToggleCollapse?: () => void;
  isCollapsed?: boolean;
}

const PROVIDER_LABELS: Record<AIProvider, string> = {
  groq: 'GROQ',
  perplexity: 'PERPLEXITY',
  anthropic: 'CLAUDE',
};

const MODEL_NAMES: Record<AIProvider, string> = {
  groq: 'llama-3.3-70b-versatile',
  perplexity: 'sonar-pro',
  anthropic: 'claude-sonnet-4-20250514',
};

export const ChatInterface = ({
  documentId,
  documentTitle,
  apiKeys,
  availableProviders,
  onOpenSettings,
  initialMessage,
  onInitialMessageSent,
  onToggleCollapse,
  isCollapsed,
}: ChatInterfaceProps) => {
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('groq');
  const [inputValue, setInputValue] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const getApiKey = () => {
    if (!apiKeys) return undefined;
    switch (selectedProvider) {
      case 'groq': return apiKeys.groqApiKey;
      case 'perplexity': return apiKeys.perplexityApiKey;
      case 'anthropic': return apiKeys.anthropicApiKey;
    }
  };

  const { messages, loading, error, sendMessage, clearChat } = useChat(
    documentId,
    selectedProvider,
    getApiKey()
  );

  // Handle initial message from text selection
  useEffect(() => {
    if (initialMessage && availableProviders.length > 0 && !loading) {
      sendMessage(initialMessage);
      onInitialMessageSent?.();
    }
  }, [initialMessage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (availableProviders.length > 0 && !availableProviders.includes(selectedProvider)) {
      setSelectedProvider(availableProviders[0]);
    }
  }, [availableProviders, selectedProvider]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputValue]);

  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;
    
    if (availableProviders.length === 0) {
      onOpenSettings();
      return;
    }

    const message = inputValue;
    setInputValue('');
    
    try {
      await sendMessage(message);
    } catch (err) {
      // Error handled in hook
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const openCitationInNewTab = (citation: { page: number; text: string }) => {
    const citationData = {
      documentId,
      page: citation.page,
      text: citation.text,
      documentTitle,
    };
    const encodedData = encodeURIComponent(JSON.stringify(citationData));
    window.open(`/citation?data=${encodedData}`, '_blank');
  };

  const handleExportChat = () => {
    if (messages.length === 0) {
      toast.error('No messages to export');
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - margin * 2;
      let yPosition = margin;

      const checkNewPage = (neededHeight: number) => {
        if (yPosition + neededHeight > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
          return true;
        }
        return false;
      };

      const addWrappedText = (text: string, x: number, fontSize: number) => {
        doc.setFontSize(fontSize);
        const lines = doc.splitTextToSize(text, maxWidth - (x - margin));
        
        for (const line of lines) {
          checkNewPage(fontSize * 0.5);
          doc.text(line, x, yPosition);
          yPosition += fontSize * 0.5;
        }
      };

      // Header
      doc.setFillColor(31, 41, 55);
      doc.rect(0, 0, pageWidth, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('intelliRead - Chat Export', margin, 22);
      
      yPosition = 50;
      doc.setTextColor(0, 0, 0);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Document: ${documentTitle || 'Unknown'}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Export Date: ${new Date().toLocaleString()}`, margin, yPosition);
      yPosition += 6;
      doc.text(`AI Provider: ${PROVIDER_LABELS[selectedProvider]}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Total Messages: ${messages.length}`, margin, yPosition);
      yPosition += 10;

      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      messages.forEach((message, index) => {
        checkNewPage(30);
        
        const roleLabel = message.role === 'user' ? 'User' : `Assistant (${MODEL_NAMES[selectedProvider]})`;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(roleLabel, margin, yPosition);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(128, 128, 128);
        const timestamp = message.timestamp ? new Date(message.timestamp).toLocaleString() : '';
        doc.text(timestamp, pageWidth - margin - doc.getTextWidth(timestamp), yPosition);
        yPosition += 6;

        doc.setTextColor(0, 0, 0);
        addWrappedText(message.content, margin, 10);
        yPosition += 3;

        if (message.citations && message.citations.length > 0) {
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          doc.text('Citations:', margin, yPosition);
          yPosition += 5;
          
          message.citations.forEach((citation) => {
            checkNewPage(10);
            doc.text(`• Page ${citation.page}: "${citation.text.substring(0, 100)}..."`, margin + 5, yPosition);
            yPosition += 5;
          });
        }

        yPosition += 8;

        if (index < messages.length - 1) {
          checkNewPage(5);
          doc.setDrawColor(230, 230, 230);
          doc.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 8;
        }
      });

      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 20, pageHeight - 10);
      }

      const filename = `intelliread-chat-${documentTitle?.replace(/[^a-z0-9]/gi, '-') || 'export'}-${Date.now()}.pdf`;
      doc.save(filename);
      toast.success('Chat exported successfully');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export chat');
    }
  };

  const handleDeleteChat = async () => {
    if (!documentId) return;
    
    try {
      await deleteChatHistory(documentId, selectedProvider);
      await clearChat();
      toast.success('Chat history cleared');
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to clear chat history');
    }
    setShowDeleteDialog(false);
  };

  const isProviderAvailable = (provider: AIProvider) => availableProviders.includes(provider);

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="p-3 border-b border-border shrink-0">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm">
            <MessageSquare className="w-4 h-4" />
            Ask Questions
          </h2>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-8">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isProviderAvailable(selectedProvider) ? 'bg-success' : 'bg-muted-foreground'
                    }`}
                  />
                  {PROVIDER_LABELS[selectedProvider]}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                {(['groq', 'perplexity', 'anthropic'] as AIProvider[]).map((provider) => (
                  <DropdownMenuItem
                    key={provider}
                    onClick={() => setSelectedProvider(provider)}
                    className="gap-2"
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isProviderAvailable(provider) ? 'bg-success' : 'bg-muted-foreground'
                      }`}
                    />
                    {PROVIDER_LABELS[provider]}
                    {!isProviderAvailable(provider) && (
                      <span className="text-xs text-muted-foreground">(Not configured)</span>
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onOpenSettings} className="gap-2">
                  <Settings className="w-4 h-4" />
                  Configure APIs
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                <DropdownMenuItem onClick={handleExportChat} className="gap-2">
                  <Download className="w-4 h-4" />
                  Export Chat
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)} 
                  className="gap-2 text-destructive focus:text-destructive"
                  disabled={messages.length === 0}
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Chat History
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {onToggleCollapse && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCollapse}
                className="h-8 w-8"
                title={isCollapsed ? "Expand chat" : "Collapse chat"}
              >
                {isCollapsed ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area - Fixed height with scroll */}
      <ScrollArea className="flex-1 min-h-0" ref={scrollRef}>
        <div className="p-4">
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {messages.map((message, idx) => (
                <MessageBubble 
                  key={idx} 
                  message={message} 
                  onCitationClick={openCitationInNewTab}
                />
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              )}
            </div>
          )}
          {error && (
            <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-3 border-t border-border shrink-0">
        {!documentId ? (
          <div className="text-center text-muted-foreground text-sm">
            Upload a document to start asking questions
          </div>
        ) : availableProviders.length === 0 ? (
          <Button onClick={onOpenSettings} variant="outline" className="w-full">
            <Settings className="w-4 h-4 mr-2" />
            Configure API Keys to Start
          </Button>
        ) : (
          <div className="flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question... (Shift + Enter for new line)"
              disabled={loading}
              className="flex-1 min-h-[44px] max-h-[120px] resize-none text-sm"
              rows={1}
            />
            <Button 
              onClick={handleSend} 
              disabled={loading || !inputValue.trim()}
              className="shrink-0"
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Chat History</AlertDialogTitle>
            <AlertDialogDescription>
              Clear all messages for {PROVIDER_LABELS[selectedProvider]}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteChat}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-6 text-center">
    <div className="flex items-center justify-center w-12 h-12 bg-muted rounded-full mb-3">
      <MessageSquare className="w-6 h-6 text-muted-foreground" />
    </div>
    <p className="text-muted-foreground text-sm mb-3">Ask questions about the document</p>
    <div className="text-xs text-muted-foreground space-y-1">
      <p className="font-medium mb-1">Example questions:</p>
      <p className="text-primary">• "What is the main topic of this document?"</p>
      <p className="text-primary">• "Summarize the key findings"</p>
      <p className="text-primary">• "What are the conclusions?"</p>
    </div>
  </div>
);

interface MessageBubbleProps {
  message: ChatMessage;
  onCitationClick: (citation: { page: number; text: string }) => void;
}

const MessageBubble = ({ message, onCitationClick }: MessageBubbleProps) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div className={`max-w-[85%] ${isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}>
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        {message.citations && message.citations.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border/30">
            <p className="text-xs text-muted-foreground mb-2">Sources:</p>
            <div className="flex flex-wrap gap-1">
              {message.citations.slice(0, 5).map((citation, idx) => (
                <button
                  key={idx}
                  onClick={() => onCitationClick(citation)}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Page {citation.page}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
