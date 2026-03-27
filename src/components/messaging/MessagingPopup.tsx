import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  useConversations,
  useMessages,
  useSendMessage,
  useCreateConversation,
  useClinicStaff,
  useConversationParticipants,
  useUnreadMessageCount,
  Conversation,
} from '@/hooks/useMessaging';
import { useAuth } from '@/hooks/useAuth';
import { Send, ArrowLeft, Users, MessageCircle, Loader2, Search, Check, CheckCheck, Minus, X, Maximize2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type PopupState = 'closed' | 'minimized' | 'open';
type View = 'list' | 'chat';

export function MessagingPopup() {
  const [popupState, setPopupState] = useState<PopupState>('closed');
  const [view, setView] = useState<View>('list');
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const { data: conversations, isLoading: convsLoading } = useConversations();
  const { data: messages, isLoading: msgsLoading } = useMessages(activeConversation?.id || null);
  const { data: participants } = useConversationParticipants(activeConversation?.id || null);
  const { data: clinicStaff } = useClinicStaff();
  const { data: unreadCount } = useUnreadMessageCount();
  const sendMessage = useSendMessage();
  const createConversation = useCreateConversation();
  const queryClient = useQueryClient();

  const markAsRead = useCallback(async (conversationId: string) => {
    if (!user) return;
    await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);
    queryClient.invalidateQueries({ queryKey: ['unread_message_count'] });
  }, [user, queryClient]);

  const staffMap = useMemo(() => {
    const map = new Map<string, string>();
    clinicStaff?.forEach(s => map.set(s.user_id, s.full_name));
    if (user) map.set(user.id, 'Moi');
    return map;
  }, [clinicStaff, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const getConversationDisplayName = (conv: Conversation) => {
    if (conv.title) return conv.title;
    if (conv.participant_names && conv.participant_names.length > 0) {
      return conv.participant_names.join(', ');
    }
    return 'Conversation';
  };

  const handleSend = async () => {
    if (!messageText.trim() || !activeConversation) return;
    const text = messageText.trim();
    setMessageText('');
    await sendMessage.mutateAsync({ conversationId: activeConversation.id, content: text });
  };

  const handleStartConversation = async (staffUserId: string) => {
    if (conversations) {
      for (const conv of conversations) {
        if (!conv.is_group) {
          const { data: parts } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', conv.id);
          const userIds = (parts || []).map(p => p.user_id);
          if (userIds.includes(staffUserId) && userIds.includes(user!.id) && userIds.length === 2) {
            setActiveConversation(conv);
            setView('chat');
            markAsRead(conv.id);
            setSearchTerm('');
            return;
          }
        }
      }
    }
    const conv = await createConversation.mutateAsync({
      participantIds: [staffUserId],
      isGroup: false,
    });
    setActiveConversation({
      ...conv,
      participant_names: [staffMap.get(staffUserId) || 'Inconnu'],
    });
    setView('chat');
    markAsRead(conv.id);
    setSearchTerm('');
  };

  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) return conversations || [];
    return (conversations || []).filter(c =>
      getConversationDisplayName(c).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [conversations, searchTerm]);

  const staffSuggestions = useMemo(() => {
    if (!searchTerm.trim() || !clinicStaff) return [];
    const existingParticipantNames = new Set(
      (conversations || []).flatMap(c => c.participant_names || [])
    );
    return clinicStaff.filter(s =>
      s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !existingParticipantNames.has(s.full_name)
    );
  }, [searchTerm, clinicStaff, conversations]);

  const handleClose = () => {
    setPopupState('closed');
    setView('list');
    setActiveConversation(null);
    setSearchTerm('');
  };

  const handleMinimize = () => {
    setPopupState('minimized');
  };

  const handleOpen = () => {
    setPopupState('open');
  };

  // Minimized bar
  if (popupState === 'minimized') {
    return (
      <div className="fixed bottom-0 right-6 z-50 flex items-center gap-2 bg-primary text-primary-foreground rounded-t-lg px-4 py-2 cursor-pointer shadow-lg min-w-[280px]"
        onClick={handleOpen}
      >
        <MessageCircle className="h-4 w-4" />
        <span className="text-sm font-medium truncate flex-1">
          {activeConversation ? getConversationDisplayName(activeConversation) : 'Messagerie'}
        </span>
        {(unreadCount ?? 0) > 0 && (
          <span className="bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
            {unreadCount! > 99 ? '99+' : unreadCount}
          </span>
        )}
        <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20" onClick={(e) => { e.stopPropagation(); handleOpen(); }}>
          <Maximize2 className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20" onClick={(e) => { e.stopPropagation(); handleClose(); }}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  // Closed - show floating button
  if (popupState === 'closed') {
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl hover:bg-primary/90 transition-all flex items-center justify-center"
      >
        <MessageCircle className="h-6 w-6" />
        {(unreadCount ?? 0) > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
            {unreadCount! > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    );
  }

  // Open popup
  return (
    <div className="fixed bottom-0 right-6 z-50 w-[380px] h-[500px] bg-background border border-border rounded-t-xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground shrink-0 rounded-t-xl">
        {view === 'chat' && (
          <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={() => { setView('list'); setActiveConversation(null); }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <MessageCircle className="h-4 w-4 shrink-0" />
        <span className="text-sm font-medium truncate flex-1">
          {view === 'chat' && activeConversation ? getConversationDisplayName(activeConversation) : 'Messagerie'}
        </span>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20" onClick={handleMinimize}>
          <Minus className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20" onClick={handleClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* List View */}
        {view === 'list' && (
          <>
            <div className="p-2 border-b shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              {convsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {filteredConversations.length > 0 && (
                    <div className="divide-y">
                      {filteredConversations.map(conv => {
                        const displayName = getConversationDisplayName(conv);
                        const hasUnread = (conv.unread_count ?? 0) > 0;
                        return (
                          <button
                            key={conv.id}
                            className={`w-full px-3 py-2.5 text-left hover:bg-muted/50 transition-colors flex items-center gap-2.5 ${hasUnread ? 'bg-muted/20' : ''}`}
                            onClick={() => { setActiveConversation(conv); setView('chat'); markAsRead(conv.id); }}
                          >
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                {conv.is_group ? <Users className="h-3.5 w-3.5" /> : getInitials(displayName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs truncate ${hasUnread ? 'font-bold' : 'font-medium'}`}>{displayName}</p>
                              {conv.last_message && (
                                <p className={`text-[11px] truncate ${hasUnread ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                                  {conv.last_message.length > 35 ? conv.last_message.slice(0, 35) + '…' : conv.last_message}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-0.5 shrink-0">
                              <span className="text-[9px] text-muted-foreground">
                                {format(new Date(conv.last_message_at || conv.updated_at), 'HH:mm', { locale: fr })}
                              </span>
                              {hasUnread && (
                                <span className="bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full h-4 min-w-4 flex items-center justify-center px-0.5">
                                  {conv.unread_count! > 99 ? '99+' : conv.unread_count}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {staffSuggestions.length > 0 && (
                    <div>
                      <p className="px-3 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        Nouvelle conversation
                      </p>
                      <div className="divide-y">
                        {staffSuggestions.map(staff => (
                          <button
                            key={staff.user_id}
                            className="w-full px-3 py-2.5 text-left hover:bg-muted/50 transition-colors flex items-center gap-2.5"
                            onClick={() => handleStartConversation(staff.user_id)}
                          >
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarFallback className="text-[10px] bg-accent text-accent-foreground">
                                {getInitials(staff.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-xs font-medium">{staff.full_name}</p>
                              {staff.specialty && <p className="text-[10px] text-muted-foreground">{staff.specialty}</p>}
                            </div>
                            <MessageCircle className="h-3.5 w-3.5 text-muted-foreground ml-auto shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchTerm.trim() && filteredConversations.length === 0 && staffSuggestions.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-1.5">
                      <Search className="h-6 w-6" />
                      <p className="text-xs">Aucun résultat</p>
                    </div>
                  )}

                  {!searchTerm.trim() && filteredConversations.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                      <MessageCircle className="h-8 w-8" />
                      <p className="text-xs">Aucune conversation</p>
                      <p className="text-[10px]">Tapez un nom pour démarrer</p>
                    </div>
                  )}
                </>
              )}
            </ScrollArea>
          </>
        )}

        {/* Chat View */}
        {view === 'chat' && activeConversation && (
          <div className="flex flex-col h-full">
            {participants && participants.length > 2 && (
              <div className="px-3 py-1.5 border-b bg-muted/30 flex gap-1 flex-wrap shrink-0">
                {participants.map(p => (
                  <Badge key={p.id} variant="outline" className="text-[9px] py-0">
                    {staffMap.get(p.user_id) || p.user_id.slice(0, 8)}
                  </Badge>
                ))}
              </div>
            )}

            <ScrollArea className="flex-1 px-3 py-2">
              {msgsLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : !messages || messages.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-6">
                  Commencez la discussion !
                </p>
              ) : (
                <div className="space-y-2">
                  {messages.map(msg => {
                    const isMe = msg.sender_id === user?.id;
                    const senderName = staffMap.get(msg.sender_id) || 'Inconnu';
                    const isRead = isMe && participants
                      ? participants
                          .filter(p => p.user_id !== user?.id)
                          .some(p => p.last_read_at && new Date(p.last_read_at) >= new Date(msg.created_at))
                      : false;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-xl px-2.5 py-1.5 ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          {!isMe && (
                            <p className="text-[9px] font-medium opacity-70 mb-0.5">{senderName}</p>
                          )}
                          <p className="text-xs whitespace-pre-wrap break-words">{msg.content}</p>
                          <div className={`flex items-center gap-0.5 mt-0.5 ${isMe ? 'justify-end' : ''}`}>
                            <span className={`text-[9px] ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                              {format(new Date(msg.created_at), 'HH:mm')}
                            </span>
                            {isMe && (
                              isRead
                                ? <CheckCheck className="h-2.5 w-2.5 text-blue-300" />
                                : <Check className="h-2.5 w-2.5 text-primary-foreground/50" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            <div className="p-2 border-t shrink-0 flex gap-1.5">
              <Input
                placeholder="Message..."
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                className="flex-1 h-8 text-sm"
              />
              <Button size="icon" className="h-8 w-8" onClick={handleSend} disabled={!messageText.trim() || sendMessage.isPending}>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
