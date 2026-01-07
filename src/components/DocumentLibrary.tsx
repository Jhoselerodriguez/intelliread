import { ArrowLeft, Calendar, Trash2, FileText, Hash, Files } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import type { Document } from '@/types';

interface DocumentLibraryProps {
  documents: Document[];
  selectedDocumentId: string | undefined;
  onSelectDocument: (id: string) => void;
  onDeleteDocument: (id: string) => void;
  onBackToUpload: () => void;
  showBackButton: boolean;
}

export const DocumentLibrary = ({
  documents,
  selectedDocumentId,
  onSelectDocument,
  onDeleteDocument,
  onBackToUpload,
  showBackButton,
}: DocumentLibraryProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleDeleteClick = (e: React.MouseEvent, doc: Document) => {
    e.stopPropagation();
    setDocumentToDelete(doc);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (documentToDelete) {
      onDeleteDocument(documentToDelete.id);
    }
    setDeleteDialogOpen(false);
    setDocumentToDelete(null);
  };

  if (documents.length === 0) {
    return (
      <div className="panel-card h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">No PDFs uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="panel-card h-full flex flex-col">
      {showBackButton && (
        <div className="p-4 border-b border-border shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToUpload}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Upload
          </Button>
        </div>
      )}

      <div className="p-4 border-b border-border shrink-0">
        <h2 className="font-semibold text-foreground">Your Documents</h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              onClick={() => onSelectDocument(doc.id)}
              className={`p-4 rounded-lg cursor-pointer mb-2 transition-all hover:bg-muted/50 group relative ${
                selectedDocumentId === doc.id
                  ? 'bg-muted border-l-4 border-primary'
                  : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-10">
                  {/* Primary: Full Filename */}
                  <h3 className="font-semibold text-sm text-foreground leading-tight mb-1">
                    {doc.filename}
                  </h3>
                  
                  {/* Secondary: Stats */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1">
                    <span className="flex items-center gap-1">
                      <Files className="w-3 h-3" />
                      {doc.pageCount} pages
                    </span>
                    <span className="flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      {doc.wordCount.toLocaleString()} words
                    </span>
                  </div>
                  
                  {/* Tertiary: Upload Date */}
                  <div className="text-xs text-muted-foreground/70">
                    {formatDate(doc.uploadDate)}
                  </div>
                </div>
                
                {/* Delete button - Always visible with slight opacity */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-3 right-3 opacity-50 hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                  onClick={(e) => handleDeleteClick(e, doc)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Delete "{documentToDelete?.filename}"? This will permanently remove the document and all associated data (extracted text, tables, images, and chat history). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDocumentToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
