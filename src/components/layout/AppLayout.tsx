import { ReactNode, useState, createContext, useContext } from 'react';
import { AppSidebar } from './AppSidebar';
import { cn } from '@/lib/utils';
import { MessagingPopup } from '@/components/messaging/MessagingPopup';

export const SidebarCollapseContext = createContext<{
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}>({ collapsed: false, setCollapsed: () => {} });

export function useSidebarCollapse() {
  return useContext(SidebarCollapseContext);
}

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
}

export function AppLayout({ children, className }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <SidebarCollapseContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="relative min-h-screen">
        <AppSidebar />
        <main className={cn('min-h-screen overflow-auto transition-all duration-300', collapsed ? 'ml-[70px]' : 'ml-[260px]', className)}>
          {children}
        </main>
        <MessagingPopup />
      </div>
    </SidebarCollapseContext.Provider>
  );
}
