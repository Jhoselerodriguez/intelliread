import { Brain, Settings, Github, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface HeaderProps {
  onOpenSettings: () => void;
  hasApiKeys: boolean;
  showActionButtons?: boolean;
}

export const Header = ({ onOpenSettings, hasApiKeys, showActionButtons = true }: HeaderProps) => {
  return (
    <header className="header-gradient px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - Logo and title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-foreground/10 rounded-lg">
            <Brain className="w-6 h-6 text-header-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-header-foreground">intelliRead</h1>
            <p className="text-xs text-header-muted">PDF Intelligence Assistant</p>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          {showActionButtons && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="border-header-muted/30 bg-transparent text-header-foreground hover:bg-header-foreground/10 hover:text-header-foreground"
                  >
                    <Link to="/how-it-works">
                      <Info className="w-4 h-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>How document processing works</p>
                </TooltipContent>
              </Tooltip>
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenSettings}
                className="border-header-muted/30 bg-transparent text-header-foreground hover:bg-header-foreground/10 hover:text-header-foreground"
              >
                <Settings className="w-4 h-4 mr-2" />
                <span>API Settings</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-header-muted/30 bg-transparent text-header-foreground hover:bg-header-foreground/10 hover:text-header-foreground"
              >
                <a
                  href="https://github.com/Illusory-warden"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="w-4 h-4 mr-2" />
                  <span>Illusory-warden's-GitHub</span>
                </a>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Warning banner */}
      {!hasApiKeys && (
        <div className="mt-3 warning-banner rounded-md px-4 py-2 text-sm flex items-center gap-2">
          <span>⚠</span>
          <span>
            API keys not configured. Click{' '}
            <button
              onClick={onOpenSettings}
              className="font-semibold underline hover:no-underline"
            >
              "API Settings"
            </button>{' '}
            to add your keys and enable Q&A features.
          </span>
        </div>
      )}
    </header>
  );
};
