import { Loader2 } from 'lucide-react';

interface ProcessingProgressProps {
  status: string;
  isVisible: boolean;
}

export const ProcessingProgress = ({ status, isVisible }: ProcessingProgressProps) => {
  if (!isVisible) return null;

  return (
    <div className="processing-overlay">
      <div className="bg-card p-8 rounded-lg shadow-xl max-w-md w-full mx-4 animate-fade-in">
        <div className="flex flex-col items-center text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Processing PDF</h3>
          <p className="text-sm text-muted-foreground animate-pulse-subtle">{status}</p>
        </div>
      </div>
    </div>
  );
};
