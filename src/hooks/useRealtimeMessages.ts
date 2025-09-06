import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Project } from '../types';

interface Message {
  id: string;
  project_id: string;
  author: string;
  content: string;
  created_at: string;
  profiles?: {
    name?: string;
    email?: string;
  };
}

export function useRealtimeMessages(project: Project | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!project) {
      setMessages([]);
      setLoading(false);
      return;
    }

    // Fetch initial messages
    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles:author(name, email)
        `)
        .eq('project_id', project.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        setMessages([]);
      } else {
        setMessages(data || []);
      }
      setLoading(false);
    };

    fetchMessages();

    // Set up real-time subscription
    const channel = supabase
      .channel(`project-chat-${project.id}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages', 
          filter: `project_id=eq.${project.id}` 
        },
        async (payload) => {
          // When a new message arrives, fetch its author's profile and add it to the state
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', payload.new.author)
            .single();
          
          if (profileError) {
            console.error('Error fetching profile for new message:', profileError);
          }
          
          const newMessage: Message = {
            ...payload.new as Message,
            profiles: profileData || undefined
          };
          
          setMessages((currentMessages) => [...currentMessages, newMessage]);
        }
      )
      .subscribe();

    // Cleanup subscription on component unmount or project change
    return () => {
      supabase.removeChannel(channel);
    };
  }, [project?.id]);

  return { messages, loading };
}
