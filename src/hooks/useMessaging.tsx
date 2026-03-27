import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

export interface Conversation {
  id: string;
  title: string | null;
  is_group: boolean;
  created_by: string;
  clinic_id: string | null;
  created_at: string;
  updated_at: string;
  participant_names?: string[]; // populated client-side
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export function useConversations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      // Fetch conversations
      const { data: convs, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      if (!convs || convs.length === 0) return [] as Conversation[];

      // Fetch all participants for these conversations
      const convIds = convs.map(c => c.id);
      const { data: parts } = await supabase
        .from('conversation_participants')
        .select('conversation_id, user_id')
        .in('conversation_id', convIds);

      // Fetch profile names for all participant user_ids
      const allUserIds = [...new Set((parts || []).map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', allUserIds);

      const nameMap = new Map<string, string>();
      (profiles || []).forEach(p => nameMap.set(p.user_id, p.full_name));

      // Attach participant names to each conversation
      return convs.map(conv => {
        const convParts = (parts || []).filter(p => p.conversation_id === conv.id);
        const otherNames = convParts
          .filter(p => p.user_id !== user?.id)
          .map(p => nameMap.get(p.user_id) || 'Inconnu');
        return { ...conv, participant_names: otherNames } as Conversation;
      });
    },
    enabled: !!user,
  });
}

export function useConversationParticipants(conversationId: string | null) {
  return useQuery({
    queryKey: ['conversation_participants', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversation_participants')
        .select('*')
        .eq('conversation_id', conversationId!);
      if (error) throw error;
      return data as ConversationParticipant[];
    },
    enabled: !!conversationId,
  });
}

export function useMessages(conversationId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!conversationId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  return query;
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user!.id,
          content,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['messages', data.conversation_id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ participantIds, title, isGroup }: { participantIds: string[]; title?: string; isGroup?: boolean }) => {
      // Create conversation
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .insert({
          title: title || null,
          is_group: isGroup || participantIds.length > 1,
          created_by: user!.id,
        })
        .select()
        .single();
      if (convError) throw convError;

      // Add all participants including the creator
      const allParticipants = [...new Set([user!.id, ...participantIds])];
      const { error: partError } = await supabase
        .from('conversation_participants')
        .insert(allParticipants.map(uid => ({
          conversation_id: conv.id,
          user_id: uid,
        })));
      if (partError) throw partError;

      return conv as Conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useClinicStaff() {
  const { user, role } = useAuth();
  const isSuperAdmin = role === 'super_admin';

  return useQuery({
    queryKey: ['clinic_staff', isSuperAdmin],
    queryFn: async () => {
      if (isSuperAdmin) {
        // Super admin can only chat with admins
        const { data: adminRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'admin');
        if (rolesError) throw rolesError;
        const adminIds = (adminRoles || []).map(r => r.user_id);
        if (adminIds.length === 0) return [];
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, full_name, specialty')
          .in('user_id', adminIds);
        if (error) throw error;
        return (data || []).filter(p => p.user_id !== user?.id);
      } else {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, full_name, specialty');
        if (error) throw error;
        return (data || []).filter(p => p.user_id !== user?.id);
      }
    },
    enabled: !!user,
  });
}

export function useUnreadMessageCount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['unread_message_count'],
    queryFn: async () => {
      // Get all conversations the user participates in with their last_read_at
      const { data: parts, error: partsError } = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', user!.id);
      if (partsError) throw partsError;
      if (!parts || parts.length === 0) return 0;

      let total = 0;
      for (const part of parts) {
        let query = supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', part.conversation_id)
          .neq('sender_id', user!.id);
        if (part.last_read_at) {
          query = query.gt('created_at', part.last_read_at);
        }
        const { count } = await query;
        total += count || 0;
      }
      return total;
    },
    enabled: !!user,
    refetchInterval: 30000, // poll every 30s
  });

  // Subscribe to new messages to refresh count
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('unread-count')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        queryClient.invalidateQueries({ queryKey: ['unread_message_count'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  return query;
}
