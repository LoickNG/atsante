import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
}

export function AppLayout({ children, className }: AppLayoutProps) {
  return (
    <div className="relative flex min-h-screen">
      <AppSidebar />
      <main className={cn('flex-1 overflow-auto', className)}>
        {children}
      </main>
    </div>
  );
}
