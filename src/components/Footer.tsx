import { Check, AlertTriangle } from 'lucide-react';

interface FooterProps {
  hasMandatoryKeys: boolean;
}

export const Footer = ({ hasMandatoryKeys }: FooterProps) => {
  return (
    <footer className="bg-muted/50 border-t border-border py-4 text-center text-sm text-muted-foreground">
      <p className="mb-1">
        Built by{' '}
        <a
          href="https://github.com/Illusory-warden"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Illusory-Warden
        </a>{' '}
        • Fully client-side PDF processing
      </p>
      <p className="flex items-center justify-center gap-2">
        {hasMandatoryKeys ? (
          <>
            <Check className="w-4 h-4 text-success" />
            <span className="text-success">API keys configured</span>
          </>
        ) : (
          <>
            <AlertTriangle className="w-4 h-4 text-warning" />
            <span className="text-warning">Required API keys not configured</span>
          </>
        )}
      </p>
    </footer>
  );
};
