import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Send, Plus, ArrowLeft, Users, MessageCircle, Loader2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MessagingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type View = 'list' | 'chat' | 'new';

export function MessagingDialog({ open, onOpenChange }: MessagingDialogProps) {
  const [view, setView] = useState<View>('list');
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupTitle, setGroupTitle] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const { data: conversations, isLoading: convsLoading } = useConversations();
  const { data: messages, isLoading: msgsLoading } = useMessages(activeConversation?.id || null);
  const { data: participants } = useConversationParticipants(activeConversation?.id || null);
  const { data: clinicStaff } = useClinicStaff();
  const sendMessage = useSendMessage();
  const createConversation = useCreateConversation();

  // Staff name map
  const staffMap = new Map<string, string>();
  clinicStaff?.forEach(s => staffMap.set(s.user_id, s.full_name));
  // Add current user
  if (user) staffMap.set(user.id, 'Moi');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!open) {
      setView('list');
      setActiveConversation(null);
      setSelectedUsers([]);
      setSearchTerm('');
      setGroupTitle('');
    }
  }, [open]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getConversationName = (conv: Conversation) => {
    if (conv.title) return conv.title;
    // For non-group: find the other participant name from clinic staff
    return 'Conversation';
  };

  const handleSend = async () => {
    if (!messageText.trim() || !activeConversation) return;
    const text = messageText.trim();
    setMessageText('');
    await sendMessage.mutateAsync({ conversationId: activeConversation.id, content: text });
  };

  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) return;
    const isGroup = selectedUsers.length > 1;
    const title = isGroup ? (groupTitle || selectedUsers.map(id => staffMap.get(id) || '').join(', ')) : undefined;
    const conv = await createConversation.mutateAsync({
      participantIds: selectedUsers,
      title,
      isGroup,
    });
    setActiveConversation(conv);
    setView('chat');
    setSelectedUsers([]);
    setGroupTitle('');
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const filteredStaff = clinicStaff?.filter(s =>
    s.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg h-[600px] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="p-4 pb-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            {view !== 'list' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => { setView('list'); setActiveConversation(null); setSelectedUsers([]); }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle className="text-base">
              {view === 'list' && 'Messagerie'}
              {view === 'chat' && (activeConversation ? getConversationName(activeConversation) : 'Chat')}
              {view === 'new' && 'Nouvelle conversation'}
            </DialogTitle>
            {view === 'list' && (
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto h-8 w-8"
                onClick={() => setView('new')}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 min-h-0">
          {/* Conversation List */}
          {view === 'list' && (
            <ScrollArea className="h-full">
              {convsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !conversations || conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
                  <MessageCircle className="h-10 w-10" />
                  <p className="text-sm">Aucune conversation</p>
                  <Button variant="outline" size="sm" onClick={() => setView('new')}>
                    <Plus className="h-4 w-4 mr-1" /> Commencer
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {conversations.map(conv => (
                    <button
                      key={conv.id}
                      className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center gap-3"
                      onClick={() => { setActiveConversation(conv); setView('chat'); }}
                    >
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {conv.is_group ? <Users className="h-4 w-4" /> : getInitials(getConversationName(conv))}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{getConversationName(conv)}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(conv.updated_at), 'dd MMM HH:mm', { locale: fr })}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}

          {/* Chat View */}
          {view === 'chat' && activeConversation && (
            <div className="flex flex-col h-full">
              {/* Participants bar */}
              {participants && participants.length > 0 && (
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
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-xl px-3 py-2 ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            {!isMe && (
                              <p className="text-[10px] font-medium opacity-70 mb-0.5">{senderName}</p>
                            )}
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                            <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                              {format(new Date(msg.created_at), 'HH:mm')}
                            </p>
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

          {/* New Conversation */}
          {view === 'new' && (
            <div className="flex flex-col h-full">
              <div className="p-4 space-y-3 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un collègue..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {selectedUsers.length > 1 && (
                  <Input
                    placeholder="Nom du groupe (optionnel)"
                    value={groupTitle}
                    onChange={e => setGroupTitle(e.target.value)}
                  />
                )}
                {selectedUsers.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {selectedUsers.map(uid => (
                      <Badge key={uid} variant="secondary" className="text-xs cursor-pointer" onClick={() => toggleUser(uid)}>
                        {staffMap.get(uid) || uid.slice(0, 8)} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <ScrollArea className="flex-1 px-4">
                {filteredStaff?.map(staff => (
                  <label
                    key={staff.user_id}
                    className="flex items-center gap-3 py-2.5 px-2 rounded-md hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedUsers.includes(staff.user_id)}
                      onCheckedChange={() => toggleUser(staff.user_id)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getInitials(staff.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{staff.full_name}</p>
                      {staff.specialty && (
                        <p className="text-xs text-muted-foreground">{staff.specialty}</p>
                      )}
                    </div>
                  </label>
                ))}
              </ScrollArea>

              <div className="p-4 border-t shrink-0">
                <Button
                  className="w-full"
                  disabled={selectedUsers.length === 0 || createConversation.isPending}
                  onClick={handleCreateConversation}
                >
                  {createConversation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <MessageCircle className="h-4 w-4 mr-2" />
                  )}
                  Démarrer la conversation
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
