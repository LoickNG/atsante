import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
  Conversation,
} from '@/hooks/useMessaging';
import { useAuth } from '@/hooks/useAuth';
import { Send, ArrowLeft, Users, MessageCircle, Loader2, Search, Check, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MessagingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type View = 'list' | 'chat';

export function MessagingDialog({ open, onOpenChange }: MessagingDialogProps) {
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
  const sendMessage = useSendMessage();
  const createConversation = useCreateConversation();
  const queryClient = useQueryClient();

  // Mark conversation as read when opening it
  const markAsRead = useCallback(async (conversationId: string) => {
    if (!user) return;
    await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);
    queryClient.invalidateQueries({ queryKey: ['unread_message_count'] });
  }, [user, queryClient]);

  // Staff name map
  const staffMap = useMemo(() => {
    const map = new Map<string, string>();
    clinicStaff?.forEach(s => map.set(s.user_id, s.full_name));
    if (user) map.set(user.id, 'Moi');
    return map;
  }, [clinicStaff, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!open) {
      setView('list');
      setActiveConversation(null);
      setSearchTerm('');
    }
  }, [open]);

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
    // Check if a 1:1 conversation already exists
    const existing = conversations?.find(c =>
      !c.is_group &&
      c.participant_names?.length === 1 &&
      c.participant_names.some(() => {
        // Check participants include this staff member
        return true; // We'll match by checking conversation participants
      })
    );

    // Try to find existing 1:1 with this person
    if (conversations) {
      for (const conv of conversations) {
        if (!conv.is_group) {
          // Check if this conversation has this staff as participant
          const { data: parts } = await (await import('@/integrations/supabase/client')).supabase
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

    // Create new conversation
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

  // Unified search: filter conversations + show staff to start new chats
  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) return conversations || [];
    return (conversations || []).filter(c =>
      getConversationDisplayName(c).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [conversations, searchTerm]);

  const staffSuggestions = useMemo(() => {
    if (!searchTerm.trim() || !clinicStaff) return [];
    // Show staff that match the search but don't have an existing conversation shown
    const existingParticipantNames = new Set(
      (conversations || []).flatMap(c => c.participant_names || [])
    );
    return clinicStaff.filter(s =>
      s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !existingParticipantNames.has(s.full_name)
    );
  }, [searchTerm, clinicStaff, conversations]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg h-[600px] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="p-4 pb-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            {view === 'chat' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => { setView('list'); setActiveConversation(null); }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle className="text-base">
              {view === 'list' && 'Messagerie'}
              {view === 'chat' && activeConversation && getConversationDisplayName(activeConversation)}
            </DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            Messagerie interne de la clinique
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Conversation List */}
          {view === 'list' && (
            <>
              {/* Search bar */}
              <div className="p-3 border-b shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher ou démarrer une discussion..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1">
                {convsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    {/* Existing conversations */}
                    {filteredConversations.length > 0 && (
                      <div className="divide-y">
                        {filteredConversations.map(conv => {
                          const displayName = getConversationDisplayName(conv);
                          const hasUnread = (conv.unread_count ?? 0) > 0;
                          return (
                            <button
                              key={conv.id}
                              className={`w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center gap-3 ${hasUnread ? 'bg-muted/20' : ''}`}
                              onClick={() => { setActiveConversation(conv); setView('chat'); markAsRead(conv.id); }}
                            >
                              <Avatar className="h-9 w-9 shrink-0">
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                  {conv.is_group ? <Users className="h-4 w-4" /> : getInitials(displayName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className={`text-sm truncate ${hasUnread ? 'font-bold' : 'font-medium'}`}>{displayName}</p>
                                {conv.last_message ? (
                                  <p className={`text-xs truncate ${hasUnread ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                                    {conv.last_message.length > 40 ? conv.last_message.slice(0, 40) + '…' : conv.last_message}
                                  </p>
                                ) : (
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(conv.updated_at), 'dd MMM HH:mm', { locale: fr })}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                <span className="text-[10px] text-muted-foreground">
                                  {format(new Date(conv.last_message_at || conv.updated_at), 'HH:mm', { locale: fr })}
                                </span>
                                {hasUnread && (
                                  <span className="bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                                    {conv.unread_count! > 99 ? '99+' : conv.unread_count}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Staff suggestions for new conversations */}
                    {staffSuggestions.length > 0 && (
                      <div>
                        <p className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Nouvelle conversation
                        </p>
                        <div className="divide-y">
                          {staffSuggestions.map(staff => (
                            <button
                              key={staff.user_id}
                              className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center gap-3"
                              onClick={() => handleStartConversation(staff.user_id)}
                            >
                              <Avatar className="h-9 w-9 shrink-0">
                                <AvatarFallback className="text-xs bg-accent text-accent-foreground">
                                  {getInitials(staff.full_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-sm font-medium">{staff.full_name}</p>
                                {staff.specialty && (
                                  <p className="text-xs text-muted-foreground">{staff.specialty}</p>
                                )}
                              </div>
                              <MessageCircle className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Show all staff when searching and no conversations match */}
                    {searchTerm.trim() && filteredConversations.length === 0 && staffSuggestions.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                        <Search className="h-8 w-8" />
                        <p className="text-sm">Aucun résultat pour "{searchTerm}"</p>
                      </div>
                    )}

                    {/* Empty state */}
                    {!searchTerm.trim() && filteredConversations.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
                        <MessageCircle className="h-10 w-10" />
                        <p className="text-sm">Aucune conversation</p>
                        <p className="text-xs">Tapez un nom pour démarrer une discussion</p>
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
              {/* Participants bar */}
              {participants && participants.length > 2 && (
                <div className="px-4 py-2 border-b bg-muted/30 flex gap-1.5 flex-wrap shrink-0">
                  {participants.map(p => (
                    <Badge key={p.id} variant="outline" className="text-[10px]">
                      {staffMap.get(p.user_id) || p.user_id.slice(0, 8)}
                    </Badge>
                  ))}
                </div>
              )}

              <ScrollArea className="flex-1 px-4 py-3">
                {msgsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : !messages || messages.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    Aucun message. Commencez la discussion !
                  </p>
                ) : (
                  <div className="space-y-3">
                    {messages.map(msg => {
                      const isMe = msg.sender_id === user?.id;
                      const senderName = staffMap.get(msg.sender_id) || 'Inconnu';
                      // Check if other participants have read this message
                      const isRead = isMe && participants
                        ? participants
                            .filter(p => p.user_id !== user?.id)
                            .some(p => p.last_read_at && new Date(p.last_read_at) >= new Date(msg.created_at))
                        : false;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-xl px-3 py-2 ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            {!isMe && (
                              <p className="text-[10px] font-medium opacity-70 mb-0.5">{senderName}</p>
                            )}
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                            <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : ''}`}>
                              <span className={`text-[10px] ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                                {format(new Date(msg.created_at), 'HH:mm')}
                              </span>
                              {isMe && (
                                isRead
                                  ? <CheckCheck className="h-3 w-3 text-blue-300" />
                                  : <Check className="h-3 w-3 text-primary-foreground/50" />
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

              {/* Message input */}
              <div className="p-3 border-t shrink-0 flex gap-2">
                <Input
                  placeholder="Votre message..."
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  className="flex-1"
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!messageText.trim() || sendMessage.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
