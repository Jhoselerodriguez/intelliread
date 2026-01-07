import { useState, useEffect } from 'react';
import { Sun, Moon, Smartphone } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

type ThemeMode = 'light' | 'dark' | 'amoled';

export const ThemeToggle = () => {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>('light');

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('intelliread-theme') as ThemeMode;
    if (savedTheme && ['light', 'dark', 'amoled'].includes(savedTheme)) {
      applyTheme(savedTheme);
    }
  }, []);

  const applyTheme = (newTheme: ThemeMode) => {
    document.documentElement.classList.remove('light', 'dark', 'amoled');
    document.documentElement.classList.add(newTheme);
    localStorage.setItem('intelliread-theme', newTheme);
    setTheme(newTheme);
  };

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-4 h-4" />;
      case 'dark':
        return <Moon className="w-4 h-4" />;
      case 'amoled':
        return <Smartphone className="w-4 h-4" />;
    }
  };

  if (!mounted) {
    return <div className="w-[100px] h-9" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 capitalize">
          {getIcon()}
          {theme}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover">
        <DropdownMenuItem onClick={() => applyTheme('light')} className="gap-2">
          <Sun className="w-4 h-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => applyTheme('dark')} className="gap-2">
          <Moon className="w-4 h-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => applyTheme('amoled')} className="gap-2">
          <Smartphone className="w-4 h-4" />
          Amoled
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
