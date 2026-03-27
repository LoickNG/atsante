import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSidebarCollapse } from './AppLayout';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight, LogOut, Activity, Type } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { getFilteredNavigation, getRoleLabel, getRoleColor } from '@/config/navigation';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface AppSidebarProps {
  className?: string;
}
export function AppSidebar({
  className
}: AppSidebarProps) {
  const { collapsed, setCollapsed } = useSidebarCollapse();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();
  
  const userRole = role || 'medecin';
  const navigation = getFilteredNavigation(userRole);

  const { data: profileData } = useQuery({
    queryKey: ['sidebar_profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });
  
  const userName = profileData?.full_name || user?.user_metadata?.full_name || user?.email || 'Utilisateur';
  const avatarUrl = profileData?.avatar_url || undefined;
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };
  
  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };
  return <aside className={cn('fixed top-0 left-0 h-screen flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 z-30', collapsed ? 'w-[70px]' : 'w-[260px]', className)}>
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
              <Type className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">
                ATSanté
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
            <AvatarFallback className={cn(getRoleColor(userRole), 'text-white text-xs')}>
              {userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!collapsed && <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {userName}
              </p>
              <p className="truncate text-[11px] text-sidebar-foreground/60">
                {getRoleLabel(userRole)}
              </p>
            </div>}
          {!collapsed && <div className="flex gap-1">
              <NotificationBell />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleSignOut}
                    className="h-8 w-8 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  >
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