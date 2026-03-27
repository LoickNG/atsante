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
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as Conversation[];
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
  const { user } = useAuth();

  return useQuery({
    queryKey: ['clinic_staff'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, specialty');
      if (error) throw error;
      return (data || []).filter(p => p.user_id !== user?.id);
    },
    enabled: !!user,
  });
}
