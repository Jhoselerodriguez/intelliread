import { useCallback, useState } from 'react';
import { Upload, FileText, AlertTriangle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PDFUploaderProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  hasMandatoryKeys?: boolean;
  onOpenSettings?: () => void;
}

export const PDFUploader = ({ 
  onFileSelect, 
  isProcessing, 
  hasMandatoryKeys = true,
  onOpenSettings 
}: PDFUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (hasMandatoryKeys) {
      setIsDragging(true);
    }
  }, [hasMandatoryKeys]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (!hasMandatoryKeys) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'application/pdf') {
      onFileSelect(files[0]);
    }
  }, [onFileSelect, hasMandatoryKeys]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!hasMandatoryKeys) return;
    
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect, hasMandatoryKeys]);

  const isDisabled = isProcessing || !hasMandatoryKeys;

  return (
    <div
      className={`panel-card p-12 flex flex-col items-center justify-center transition-all border-2 border-dashed ${
        isDragging 
          ? 'border-primary bg-primary/5' 
          : hasMandatoryKeys 
            ? 'border-border hover:border-primary/50' 
            : 'border-warning/50 bg-warning/5'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {!hasMandatoryKeys && (
        <div className="mb-6 p-4 rounded-lg bg-warning/10 border border-warning/30 flex items-start gap-3 max-w-md">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-warning mb-1">API Keys Required</p>
            <p className="text-muted-foreground">
              Please configure all required API keys (Google Gemini, Groq, and Perplexity) to upload PDFs.
            </p>
            {onOpenSettings && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenSettings}
                className="mt-2 gap-2"
              >
                <Settings className="w-4 h-4" />
                Configure API Keys
              </Button>
            )}
          </div>
        </div>
      )}

      <div className={`flex items-center justify-center w-20 h-20 rounded-full mb-6 ${
        hasMandatoryKeys ? 'bg-muted' : 'bg-muted/50'
      }`}>
        <FileText className={`w-10 h-10 ${hasMandatoryKeys ? 'text-muted-foreground' : 'text-muted-foreground/50'}`} />
      </div>

      <h2 className={`text-2xl font-bold mb-2 ${hasMandatoryKeys ? 'text-foreground' : 'text-muted-foreground'}`}>
        Upload PDF Document
      </h2>
      
      <p className={`text-center mb-6 max-w-md ${hasMandatoryKeys ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
        {hasMandatoryKeys ? (
          <>
            <span className="text-primary font-medium">Drag & drop</span> a PDF here, or click to upload
          </>
        ) : (
          'Configure API keys above to enable PDF uploads'
        )}
      </p>

      <label>
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileInput}
          disabled={isDisabled}
          className="hidden"
        />
        <Button
          asChild
          size="lg"
          disabled={isDisabled}
          className="cursor-pointer"
          variant={hasMandatoryKeys ? "default" : "secondary"}
        >
          <span>
            <Upload className="w-4 h-4 mr-2" />
            {hasMandatoryKeys ? 'Select PDF File' : 'Upload Disabled'}
          </span>
        </Button>
      </label>

      <p className="text-xs text-muted-foreground mt-6 text-center max-w-sm">
        All processing happens locally in your browser. Your documents never leave your device.
      </p>
    </div>
  );
};
