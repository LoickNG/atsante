import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight, LogOut, Bell, Activity, Type } from 'lucide-react';
import { getFilteredNavigation, getRoleLabel, getRoleColor } from '@/config/navigation';
import { currentUser } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
interface AppSidebarProps {
  className?: string;
}
export function AppSidebar({
  className
}: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigation = getFilteredNavigation(currentUser.role);
  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };
  return <aside className={cn('flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300', collapsed ? 'w-[70px]' : 'w-[260px]', className)}>
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
              <Type className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">
                ​TétimianPro
              </span>
              <span className="text-[10px] text-sidebar-foreground/60">
                Système Hospitalier
              </span>
            </div>
          </div>}
        {collapsed && <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
            <Activity className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-6">
          {navigation.map(section => <div key={section.title}>
              {!collapsed && <h3 className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/50">
                  {section.title}
                </h3>}
              <ul className="space-y-1">
                {section.items.map(item => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const linkContent = <Link to={item.href} className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors', active ? 'bg-sidebar-accent text-sidebar-primary' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground')}>
                      <Icon className={cn('h-5 w-5 flex-shrink-0', active && 'text-sidebar-primary')} />
                      {!collapsed && <>
                          <span className="flex-1">{item.title}</span>
                          {item.badge && <Badge variant="secondary" className="bg-sidebar-primary text-sidebar-primary-foreground text-[10px] px-1.5 py-0">
                              {item.badge}
                            </Badge>}
                        </>}
                    </Link>;
              return <li key={item.href}>
                      {collapsed ? <Tooltip delayDuration={0}>
                          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                          <TooltipContent side="right" className="flex items-center gap-2">
                            {item.title}
                            {item.badge && <Badge variant="secondary" className="text-[10px]">
                                {item.badge}
                              </Badge>}
                          </TooltipContent>
                        </Tooltip> : linkContent}
                    </li>;
            })}
              </ul>
            </div>)}
        </nav>
      </ScrollArea>

      {/* User Section */}
      <div className="border-t border-sidebar-border p-3">
        <div className={cn('flex items-center gap-3 rounded-lg p-2', collapsed && 'justify-center')}>
          <Avatar className="h-9 w-9 border-2 border-sidebar-accent">
            <AvatarFallback className={cn(getRoleColor(currentUser.role), 'text-white text-xs')}>
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          {!collapsed && <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {currentUser.name}
              </p>
              <p className="truncate text-[11px] text-sidebar-foreground/60">
                {getRoleLabel(currentUser.role)}
              </p>
            </div>}
          {!collapsed && <div className="flex gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground">
                    <Bell className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Notifications</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Déconnexion</TooltipContent>
              </Tooltip>
            </div>}
        </div>
      </div>

      {/* Collapse Toggle */}
      <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="absolute -right-3 top-20 z-10 h-6 w-6 rounded-full border border-border bg-background shadow-sm hover:bg-muted">
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </Button>
    </aside>;
}