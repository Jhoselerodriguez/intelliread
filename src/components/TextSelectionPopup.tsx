import { useState, useEffect, useRef, ReactNode } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TextSelectionPopupProps {
  children: ReactNode;
  onAskQuestion: (text: string) => void;
  className?: string;
  onScrollToChat?: () => void;
}

export const TextSelectionPopup = ({ 
  children, 
  onAskQuestion, 
  className = '',
  onScrollToChat,
}: TextSelectionPopupProps) => {
  const [selectedText, setSelectedText] = useState('');
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      setTimeout(() => {
        const selection = window.getSelection();
        const text = selection?.toString().trim();

        if (text && text.length > 10 && containerRef.current?.contains(e.target as Node)) {
          const range = selection?.getRangeAt(0);
          const rect = range?.getBoundingClientRect();

          if (rect) {
            setSelectedText(text);
            setPopupPosition({
              x: Math.min(rect.left + rect.width / 2, window.innerWidth - 150),
              y: rect.top - 10,
            });
          }
        } else if (!(e.target as HTMLElement)?.closest('.selection-popup')) {
          // Don't clear if clicking inside popup
        }
      }, 50);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement)?.closest('.selection-popup')) {
        setSelectedText('');
        setPopupPosition(null);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  const clearSelection = () => {
    setSelectedText('');
    setPopupPosition(null);
    window.getSelection()?.removeAllRanges();
  };

  // ChatGPT-style: Send directly to chat
  const handleAskAboutSelection = () => {
    const prompt = `Regarding this text from the document:\n\n"${selectedText}"\n\nPlease explain this in detail.`;
    onAskQuestion(prompt);
    clearSelection();
    // Scroll to chat after a brief delay to allow state updates
    setTimeout(() => {
      onScrollToChat?.();
    }, 100);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {children}

      {popupPosition && selectedText && (
        <div
          className="selection-popup fixed z-50 transform -translate-x-1/2 -translate-y-full"
          style={{
            left: popupPosition.x,
            top: popupPosition.y,
          }}
        >
          <div className="flex items-center gap-1 mb-2">
            <Button
              onClick={handleAskAboutSelection}
              size="sm"
              className="bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Ask intelliAi
            </Button>
            <Button
              onClick={clearSelection}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 bg-card shadow-lg"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          {/* Arrow pointing down */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-primary" />
        </div>
      )}
    </div>
  );
};
